import { prisma } from "@/lib/prisma";
import { AdminReviewsClient } from "./client";

export default async function AdminReviewsPage() {
  const reviews = await prisma.trekReview.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      trek: { select: { title: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => !r.approved).length,
    approved: reviews.filter((r) => r.approved).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="mt-1 text-sm text-slate-500">
            Moderate customer reviews before they appear on the site
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-lg font-bold text-slate-600">∑</span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Reviews</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <span className="text-lg font-bold text-amber-600">!</span>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-slate-500">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <span className="text-lg font-bold text-emerald-600">✓</span>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{stats.approved}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <AdminReviewsClient reviews={JSON.parse(JSON.stringify(reviews))} />
    </div>
  );
}
