"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Star, Send, LogIn } from "lucide-react";
import Link from "next/link";

interface ReviewFormProps {
  trekId: string;
}

export function ReviewForm({ trekId }: ReviewFormProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!session?.user) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <LogIn className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Want to leave a review?</h3>
        <p className="mt-2 text-sm text-slate-500">Please log in or create an account to submit a review.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setMessage({ type: "error", text: "Please select a rating" });
      return;
    }
    if (text.trim().length < 10) {
      setMessage({ type: "error", text: "Review must be at least 10 characters" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId, rating, text: text.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Something went wrong" });
      } else {
        setMessage({ type: "success", text: "Review submitted! It will appear once approved by an admin." });
        setRating(0);
        setText("");
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">Write a Review</h3>
      <p className="mt-1 text-sm text-slate-500">Share your experience with this trek</p>

      {/* Star Rating */}
      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Your Rating</label>
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  (hoverRating || rating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-medium text-slate-600">
              {rating === 1 ? "Poor" : rating === 2 ? "Fair" : rating === 3 ? "Good" : rating === 4 ? "Very Good" : "Excellent"}
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div className="mt-4">
        <label htmlFor="review-text" className="text-sm font-medium text-slate-700">
          Your Review
        </label>
        <textarea
          id="review-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share details about your experience..."
          className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-slate-400">{text.length}/1000 characters</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit */}
      <div className="mt-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            "Submitting..."
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Review
            </>
          )}
        </button>
      </div>
    </form>
  );
}
