"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, CreditCard, Landmark, CheckCircle } from "lucide-react";

const paymentMethods = [
  {
    id: "stripe",
    name: "Credit / Debit Card",
    description: "Pay securely with Visa, Mastercard, or American Express",
    icon: CreditCard,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    id: "esewa",
    name: "eSewa",
    description: "Pay via eSewa digital wallet",
    icon: Landmark,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
];

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [bookingId, setBookingId] = useState<string>("");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"ADVANCE" | "FULL">("FULL");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setBookingId(p.id));
  }, [params]);

  // Fetch booking details
  useEffect(() => {
    if (!bookingId) return;

    async function fetchBooking() {
      try {
        const res = await fetch(`/api/booking?id=${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
        } else {
          setBooking({ id: bookingId, status: "PENDING_REVIEW" });
        }
      } catch {
        setBooking({ id: bookingId, status: "PENDING_REVIEW" });
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [bookingId]);

  async function handlePay() {
    if (!selectedMethod || !bookingId) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/api/payments/${selectedMethod}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paymentType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment initiation failed");
        setProcessing(false);
        return;
      }

      // Handle based on payment method
      if (selectedMethod === "stripe") {
        // Redirect to a Stripe checkout page or use Elements
        router.push(`/payment/${bookingId}/stripe?clientSecret=${data.clientSecret}`);
      } else if (data.paymentUrl && data.formData) {
        // eSewa uses a form POST - create a form and submit it
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.paymentUrl;
        form.target = "_blank";
        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        // Poll for payment completion
        setProcessing(false);
        router.push(`/payment/${bookingId}/processing?method=${selectedMethod}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment");
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted">You need to sign in to complete payment.</p>
        <Link
          href={`/login?callbackUrl=/payment/${bookingId}`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-primary-dark hover:to-primary-dark"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground">Complete Payment</h1>
      <p className="mt-2 text-sm text-muted">Choose your preferred payment method</p>

      {/* Booking Summary */}
      {booking && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Booking #{bookingId.slice(0, 8)}...
              </p>
              <p className="text-xs text-muted">
                Status: <span className="font-medium text-warning">{booking.status?.replace(/_/g, " ")}</span>
              </p>
            </div>
            {booking.totalPrice && (
              <p className="text-xl font-bold text-primary">${booking.totalPrice.toLocaleString()}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-error/10 border border-error/20 p-4 text-sm text-error">
          ⚠️ {error}
        </div>
      )}

      {/* Payment Type Selection */}
      {booking?.totalPrice && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Payment Amount</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentType("ADVANCE")}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                paymentType === "ADVANCE"
                  ? "border-primary/20 bg-primary/10 shadow-sm"
                  : "border-border bg-surface hover:border-secondary-light"
              }`}
            >
              <p className="text-xs font-medium text-muted">Pay 20% Advance</p>
              <p className="mt-1 text-xl font-bold text-primary">
                ${(Math.round(booking.totalPrice * 0.2 * 100) / 100).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted">Secure your booking</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentType("FULL")}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                paymentType === "FULL"
                  ? "border-primary/20 bg-primary/10 shadow-sm"
                  : "border-border bg-surface hover:border-secondary-light"
              }`}
            >
              <p className="text-xs font-medium text-muted">Pay Full Amount</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                ${booking.totalPrice.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted">Pay entire amount now</p>
            </button>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="mt-6 space-y-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const selected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                selected
                  ? `${method.borderColor} ${method.bgColor} shadow-sm`
                  : "border-border bg-surface hover:border-secondary-light hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    selected ? `bg-gradient-to-br ${method.color} text-white shadow-sm` : "bg-surface-alt text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${selected ? method.textColor : "text-foreground"}`}>
                    {method.name}
                  </p>
                  <p className="text-xs text-muted">{method.description}</p>
                </div>
                {selected && <CheckCircle className={`h-5 w-5 ${method.textColor}`} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pay Button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!selectedMethod || processing}
        className="mt-8 w-full rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-primary-dark hover:to-primary-dark hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Processing...
          </span>
        ) : selectedMethod ? (
          `Pay with ${paymentMethods.find((m) => m.id === selectedMethod)?.name}`
        ) : (
          "Select a payment method"
        )}
      </button>

      <p className="mt-4 text-center text-xs text-muted">
        Your payment is secure. We use encrypted payment processing.
      </p>
    </div>
  );
}
