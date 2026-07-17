"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ bookingId, onComplete }: { bookingId: string; onComplete: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/${bookingId}/success`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">⚠️ {error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-teal-700 disabled:opacity-50"
      >
        {processing ? (
          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span>
        ) : (
          "Pay Now"
        )}
      </button>
    </form>
  );
}

export default function StripePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const [bookingId, setBookingId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setBookingId(p.id));
  }, [params]);

  useEffect(() => {
    if (!bookingId) return;
    const cs = searchParams.get("clientSecret");
    if (cs) {
      setClientSecret(cs);
      setLoading(false);
    } else {
      // Initiate payment if no clientSecret
      initiatePayment();
    }
  }, [bookingId, searchParams]);

  async function initiatePayment() {
    if (!bookingId) return;
    try {
      const res = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to initiate payment");
      } else {
        setClientSecret(data.clientSecret);
      }
    } catch {
      setError("Failed to connect to payment server");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Payment Error</h1>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <Link href={`/payment/${bookingId}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700">
          <ArrowLeft className="h-4 w-4" /> Back to payment options
        </Link>
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href={`/payment/${bookingId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to payment options
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">Pay with Card</h1>
      <p className="mt-1 text-sm text-slate-500">Enter your card details to complete payment</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm bookingId={bookingId} onComplete={() => {}} />
        </Elements>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        🔒 Secured by Stripe. Your card info is never stored on our servers.
      </p>
    </div>
  );
}
