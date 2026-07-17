import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function PaymentSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Payment Successful!</h1>
      <p className="mt-2 text-sm text-slate-500">
        Your payment has been processed successfully. Booking #{id.slice(0, 8)} is confirmed.
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
