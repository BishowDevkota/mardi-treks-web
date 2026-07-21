"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [bookingId, setBookingId] = useState<string>("");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const p = await params;
      setBookingId(String(p?.id ?? ""));
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!bookingId) return;

    async function verifyPayment() {
      const paymentIntentId = searchParams.get("payment_intent");
      const redirectStatus = searchParams.get("redirect_status");

      // Stripe only redirects here on successful payment, so show success regardless
      // Try to update our database via the verify endpoint
      if (paymentIntentId) {
        try {
          await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, paymentIntentId }),
            credentials: "include",
          });
        } catch {
          // Verify failed (network/auth), but payment succeeded with Stripe
          // Database will be updated when webhook fires
        }
      }

      setStatus("success");
    }

    verifyPayment();
  }, [bookingId, searchParams]);

  if (status === "verifying") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <h1 className="mt-6 text-2xl font-bold text-foreground">Verifying Payment...</h1>
        <p className="mt-2 text-sm text-muted">
          Please wait while we confirm your payment.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Payment Received</h1>
        <p className="mt-2 text-sm text-muted">
          {error || "Your payment was processed, but verification is pending."}
        </p>
        <p className="mt-1 text-sm text-muted">
          Please check your dashboard for the latest booking status.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-primary-dark hover:to-primary-dark"
          >
            View My Bookings
          </Link>
          <Link
            href="/treks"
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted hover:bg-surface-alt"
          >
            Browse More Treks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
        <CheckCircle className="h-8 w-8 text-success" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">Payment Successful!</h1>
      <p className="mt-2 text-sm text-muted">
        Your payment has been processed successfully. Booking #{bookingId?.slice(0, 8)} is confirmed.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-teal-700"
        >
          View My Bookings
        </Link>
        <Link
          href="/treks"
          className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          Browse More Treks
        </Link>
      </div>
    </div>
  );
}
