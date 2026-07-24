"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

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
        <div className="rounded-xl bg-error/10 border border-error/20 p-4 text-sm text-error">⚠️ {error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-primary-dark hover:to-primary-dark disabled:opacity-50"
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
  const { id: bookingId } = use(params);
  const initialClientSecret = searchParams.get("clientSecret");
  const [clientSecret, setClientSecret] = useState<string | null>(initialClientSecret);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(!initialClientSecret);
  const [error, setError] = useState<string | null>(null);

  // Fetch the Stripe publishable key at runtime, then initialize Stripe
  useEffect(() => {
    async function initStripe() {
      try {
        const res = await fetch("/api/stripe-key");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load Stripe configuration");
        }
        const { publishableKey } = await res.json();
        setStripePromise(loadStripe(publishableKey));
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment system");
        setLoading(false);
      }
    }
    initStripe();
  }, []);

  useEffect(() => {
    if (!bookingId || !stripePromise) return;
    if (initialClientSecret) return;

    async function initiatePayment() {
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
    initiatePayment();
  }, [bookingId, stripePromise, initialClientSecret]);

  if (loading || !stripePromise) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Payment Error</h1>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <Link href={`/payment/${bookingId}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark">
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
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to payment options
      </Link>

      <h1 className="text-2xl font-bold text-foreground">Pay with Card</h1>
      <p className="mt-1 text-sm text-muted">Enter your card details to complete payment</p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm bookingId={bookingId} onComplete={() => {}} />
        </Elements>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        🔒 Secured by Stripe. Your card info is never stored on our servers.
      </p>
    </div>
  );
}
