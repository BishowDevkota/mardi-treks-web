import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, FileText, CheckCircle, AlertCircle, Clock, CreditCard } from "lucide-react";

const paymentStyles: Record<string, React.CSSProperties> = {
  PENDING: { background: "var(--color-accent-light)", color: "var(--color-secondary-dark)" },
  PARTIALLY_PAID: { background: "var(--color-accent)", color: "var(--color-secondary-dark)" },
  FULLY_PAID: { background: "#dcfce7", color: "#15803d" },
};

const paymentLabels: Record<string, string> = {
  PENDING: "Payment Pending",
  PARTIALLY_PAID: "Partially Paid",
  FULLY_PAID: "Fully Paid",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function paidAmountFor(b: { totalPrice: number; paymentStatus?: string | null; payment?: any }) {
  if (b.payment?.amountPaid != null) return b.payment.amountPaid as number;
  if (b.paymentStatus === "FULLY_PAID") return b.totalPrice;
  if (b.paymentStatus === "PARTIALLY_PAID") return b.payment?.amountPaid ?? Math.round(b.totalPrice * 0.4);
  return 0;
}

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { payment: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalPaid = bookings.reduce((sum, b) => sum + paidAmountFor(b), 0);
  const totalRemaining = Math.max(0, totalSpent - totalPaid);

  // Trek category lookup for links
  const trekSlugs = [...new Set(bookings.map((b) => b.trekSlug))];
  const trekCategoryMap = new Map<string, string>();
  if (trekSlugs.length > 0) {
    const treks = await prisma.trek.findMany({
      where: { slug: { in: trekSlugs } },
      select: { slug: true, category: { select: { slug: true } } },
    });
    for (const t of treks) {
      trekCategoryMap.set(t.slug, t.category?.slug || "treks");
    }
  }
  function trekLink(slug: string): string {
    return `/${trekCategoryMap.get(slug) || "treks"}/${slug}`;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:opacity-80"
            style={{ borderColor: "var(--color-border)" }}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: "var(--color-foreground)" }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-secondary-dark)" }}>
              Invoice Ledger
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              All your bookings and payment records
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>Total Spent</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: "var(--color-secondary-dark)" }}>
              ${totalSpent.toLocaleString()}
            </p>
          </div>
          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>Total Paid</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: "var(--color-success)" }}>
              ${totalPaid.toLocaleString()}
            </p>
          </div>
          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>Remaining Balance</p>
            <p
              className="mt-1 text-2xl font-bold"
              style={{ color: totalRemaining > 0 ? "var(--color-warning)" : "var(--color-success)" }}
            >
              ${totalRemaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Invoices List */}
        {bookings.length === 0 ? (
          <div
            className="rounded-2xl border py-16 text-center"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "var(--color-surface-alt)" }}
            >
              <FileText className="h-8 w-8" style={{ color: "var(--color-text-muted)" }} />
            </div>
            <h2 className="mt-4 text-lg font-semibold" style={{ color: "var(--color-secondary-dark)" }}>
              No invoices yet
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Book a trek to see your invoices here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const paid = paidAmountFor(b);
              const remaining = Math.max(0, (b.totalPrice || 0) - paid);
              const progress = b.totalPrice > 0 ? Math.round((paid / b.totalPrice) * 100) : 0;
              const ps = b.paymentStatus || "PENDING";
              const isPaid = ps === "FULLY_PAID";

              return (
                <div
                  key={b.id}
                  className="rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Trek info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
                          {b.trekTitle}
                        </h3>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={paymentStyles[ps] || {}}
                        >
                          {paymentLabels[ps] || ps}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <span>Booked: {formatDate(b.createdAt)}</span>
                        <span>Start: {formatDate(b.startDate)}</span>
                        <span>{b.groupSize} traveler{b.groupSize > 1 ? "s" : ""}</span>
                        <span>{b.trekDuration} days</span>
                      </div>
                    </div>

                    {/* Right: Pricing & actions */}
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Total</p>
                        <p className="text-lg font-bold" style={{ color: "var(--color-secondary-dark)" }}>
                          ${b.totalPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-24 text-right">
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Status</p>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: isPaid ? "var(--color-success)" : "var(--color-warning)" }}
                        >
                          {isPaid ? "Paid" : `${progress}%`}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href={`${trekLink(b.trekSlug)}#itinerary`}
                          className="flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all hover:opacity-80"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View
                        </Link>
                        {remaining > 0 && (
                          <Link
                            href={`/payment/${b.id}`}
                            className="flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white transition-all hover:opacity-90"
                            style={{ background: "var(--color-primary)" }}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pay ${remaining.toLocaleString()}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment progress bar */}
                  {!isPaid && (
                    <div className="mt-4">
                      <div
                        className="h-2 w-full overflow-hidden rounded-full"
                        style={{ background: "var(--color-border)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: progress > 0 ? "var(--color-success)" : "var(--color-border)",
                          }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        <span>${paid.toLocaleString()} paid</span>
                        <span>${remaining.toLocaleString()} remaining</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
