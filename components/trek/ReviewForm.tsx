"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Star, Send, LogIn, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ReviewFormProps {
  trekId: string;
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

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
      <div
        className="rounded-3xl border p-8 text-center sm:p-10"
        style={{ backgroundColor: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <LogIn className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        </div>
        <h3 className="mt-4 text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
          Want to leave a review?
        </h3>
        <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Please log in or create an account to submit a review.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
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
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border p-6 sm:p-8"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h3 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
        Write a Review
      </h3>
      <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
        Share your experience with this trek
      </p>

      {/* Star Rating */}
      <div className="mt-6">
        <label className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          Your Rating
        </label>
        <div className="mt-2 flex items-center gap-1">
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
                className="h-7 w-7"
                style={{
                  fill: (hoverRating || rating) >= star ? "var(--color-warning)" : "transparent",
                  color: (hoverRating || rating) >= star ? "var(--color-warning)" : "var(--color-border)",
                }}
              />
            </button>
          ))}
          {(hoverRating || rating) > 0 && (
            <span className="ml-2 text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
              {RATING_LABELS[hoverRating || rating]}
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div className="mt-5">
        <label htmlFor="review-text" className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          Your Review
        </label>
        <textarea
          id="review-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share details about your experience..."
          className="mt-2 block w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface-alt)",
            color: "var(--color-foreground)",
          }}
          maxLength={1000}
        />
        <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {text.length}/1000 characters
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className="mt-5 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm"
          style={{
            backgroundColor: message.type === "success" ? "var(--color-success)" : "var(--color-error)",
            opacity: 0.12,
          }}
        >
          {/* colored background layer above is intentionally separate from the
              text/icon layer below so opacity only affects the tint, not the text */}
        </div>
      )}
      {message && (
        <div
          className="-mt-[calc(2.75rem+0.5rem)] flex items-start gap-2 rounded-2xl px-4 py-3 text-sm relative z-10"
          style={{ color: message.type === "success" ? "var(--color-success)" : "var(--color-error)" }}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Submit */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
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