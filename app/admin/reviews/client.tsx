"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle2, XCircle, MessageSquare, Search } from "lucide-react";
import { approveReview, rejectReview } from "./actions";

interface Review {
  id: string;
  trekId: string;
  userId: string | null;
  author: string;
  rating: number;
  text: string;
  approved: boolean;
  createdAt: string;
  trek: { title: string; slug: string } | null;
  user: { name: string | null; email: string | null } | null;
}

export function AdminReviewsClient({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const filtered = reviews.filter((r) => {
    if (filter === "pending" && r.approved) return false;
    if (filter === "approved" && !r.approved) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.text.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.trek?.title.toLowerCase().includes(q) ||
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleApprove(id: string) {
    await approveReview(id);
    router.refresh();
  }

  async function handleReject(id: string) {
    await rejectReview(id);
    setSelectedReview(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "pending", "approved"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {key === "all" ? "All" : key === "pending" ? "Pending" : "Approved"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <MessageSquare className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No reviews found</p>
          <p className="mt-1 text-xs text-slate-400">
            {filter === "pending"
              ? "All reviews have been approved"
              : filter === "approved"
              ? "No approved reviews yet"
              : "No reviews have been submitted yet"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={`p-4 transition-colors hover:bg-slate-50 ${
                !review.approved ? "bg-amber-50/50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        review.approved
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {review.approved ? "Approved" : "Pending"}
                    </span>
                  </div>

                  {/* Review text */}
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 line-clamp-2">
                    {review.text}
                  </p>

                  {/* Meta */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>By {review.author}</span>
                    {review.trek && (
                      <span>Trek: {review.trek.title}</span>
                    )}
                    {review.user?.name && (
                      <span>User: {review.user.name}</span>
                    )}
                    <span>
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {!review.approved && (
                    <>
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        title="Approve review"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                        title="Reject review"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                  {review.approved && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Live on site
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Reject Review</h3>
            <p className="mt-2 text-sm text-slate-500">
              This will permanently delete the review. Are you sure?
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 line-clamp-3">
              &ldquo;{selectedReview.text}&rdquo;
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedReview(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedReview.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
