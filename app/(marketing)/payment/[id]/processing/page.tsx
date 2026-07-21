"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

export default function PaymentProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingId, setBookingId] = useState<string>("");
  const [status, setStatus] = useState<string>("PENDING");
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    params.then((p) => setBookingId(p.id));
  }, [params]);

  // Poll for payment status — try verify endpoint first, fallback to booking check
  useEffect(() => {
    if (!bookingId) return;

    const interval = setInterval(async () => {
      try {
        // Try eSewa verification
        const verifyRes = await fetch(`/api/payments/esewa/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData.status === "confirmed") {
            setStatus("CONFIRMED");
            setPolls((p) => p + 1);
            return;
          }
        }
      } catch {}

      // Fallback: check booking status directly
      try {
        const res = await fetch(`/api/booking?id=${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.booking?.status || "PENDING");
          setPolls((p) => p + 1);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [bookingId]);

  // Redirect when confirmed
  useEffect(() => {
    if (status === "CONFIRMED") {
      const timer = setTimeout(() => router.push(`/payment/${bookingId}/success`), 1500);
      return () => clearTimeout(timer);
    }
  }, [status, bookingId, router]);

  if (status === "CONFIRMED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Payment Confirmed!</h1>
        <p className="mt-2 text-sm text-muted">Redirecting to confirmation...</p>
      </div>
    );
  }

  if (status === "FAILED" || status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <XCircle className="h-8 w-8 text-error" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Payment Failed</h1>
        <p className="mt-2 text-sm text-muted">Your payment was not completed. Please try again.</p>
        <Link
          href={`/payment/${bookingId}`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-primary-dark hover:to-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      <h1 className="mt-6 text-2xl font-bold text-foreground">Processing Payment</h1>
      <p className="mt-2 text-sm text-muted">
        Please complete the payment in the opened window.
        {polls > 0 && ` Waiting for confirmation... (${polls})`}
      </p>
      {polls > 10 && (
        <Link
          href={`/payment/${bookingId}`}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to payment options
        </Link>
      )}
    </div>
  );
}
