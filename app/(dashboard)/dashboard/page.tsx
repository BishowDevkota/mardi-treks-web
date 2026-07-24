import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Mountain,
  Calendar,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Download,
  MapPin,
  Compass,
  Wallet,
} from "lucide-react";

const statusStyles: Record<string, React.CSSProperties> = {
  PENDING_REVIEW: { background: "var(--color-warning)", color: "#fff" },
  AWAITING_PAYMENT: { background: "var(--color-primary-light)", color: "#fff" },
  CONFIRMED: { background: "var(--color-success)", color: "#fff" },
  CANCELLED: { background: "var(--color-error)", color: "#fff" },
  COMPLETED: { background: "var(--color-secondary-light)", color: "#fff" },
};

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

function daysAway(d: Date | string) {
  const ms = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// NOTE: adjust this if your Payment model stores the paid amount under a
// different field name (e.g. payment.amountPaid vs payment.paidAmount).
function paidAmountFor(b: { totalPrice: number; paymentStatus?: string | null; payment?: any }) {
  if (b.payment?.amountPaid != null) return b.payment.amountPaid as number;
  if (b.paymentStatus === "FULLY_PAID") return b.totalPrice;
  if (b.paymentStatus === "PARTIALLY_PAID") return b.payment?.amountPaid ?? Math.round(b.totalPrice * 0.4);
  return 0;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { payment: true },
    orderBy: { startDate: "desc" },
  });

  const now = new Date();
  const upcoming = bookings
    .filter((b) => new Date(b.startDate) >= now || ["CONFIRMED", "PENDING_REVIEW", "AWAITING_PAYMENT"].includes(b.status))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const completed = bookings.filter(
    (b) => new Date(b.startDate) < now && ["CONFIRMED", "COMPLETED"].includes(b.status)
  );

  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalPaid = bookings.reduce((sum, b) => sum + paidAmountFor(b), 0);
  const totalRemaining = Math.max(0, totalSpent - totalPaid);

  // Featured expedition = soonest upcoming booking
  const featured = upcoming[0] as any;
  const restUpcoming = upcoming.slice(1);

  let featuredPaid = 0;
  let featuredTotal = 0;
  let featuredRemaining = 0;
  let featuredProgress = 0;
  if (featured) {
    featuredPaid = paidAmountFor(featured);
    featuredTotal = featured.totalPrice || 0;
    featuredRemaining = Math.max(0, featuredTotal - featuredPaid);
    featuredProgress = featuredTotal > 0 ? Math.round((featuredPaid / featuredTotal) * 100) : 0;
  }

  // Recommendations based on user's booked treks
  const bookedSlugs = bookings.map((b) => b.trekSlug);
  let recommended: any[] = [];

  if (bookedSlugs.length > 0) {
    const booked = await prisma.trek.findMany({
      where: { slug: { in: bookedSlugs } },
      select: { region: true, categoryId: true },
    });
    const regions = [...new Set(booked.map((t) => t.region).filter(Boolean))] as string[];
    const catIds = [...new Set(booked.map((t) => t.categoryId).filter(Boolean))] as string[];

    recommended = await prisma.trek.findMany({
      where: {
        status: "published",
        slug: { notIn: bookedSlugs },
        OR: [
          ...(regions.length ? [{ region: { in: regions } }] : []),
          ...(catIds.length ? [{ categoryId: { in: catIds } }] : []),
        ],
      },
      select: {
        slug: true,
        title: true,
        price: true,
        duration: true,
        difficulty: true,
        region: true,
        category: { select: { slug: true } },
      },
      take: 3,
    });
  }

  if (!recommended.length) {
    recommended = await prisma.trek.findMany({
      where: { status: "published", slug: { notIn: bookedSlugs } },
      select: {
        slug: true,
        title: true,
        price: true,
        duration: true,
        difficulty: true,
        region: true,
        category: { select: { slug: true } },
      },
      take: 3,
      orderBy: { reviews: { _count: "desc" } },
    });
  }

  // Build a lookup map: trekSlug → categorySlug for correct link generation
  const allReferencedSlugs = [...new Set([...bookedSlugs, ...recommended.map((t: any) => t.slug)])];
  const trekCategoryMap = new Map<string, string>();
  if (allReferencedSlugs.length > 0) {
    const treksWithCat = await prisma.trek.findMany({
      where: { slug: { in: allReferencedSlugs } },
      select: { slug: true, category: { select: { slug: true } } },
    });
    for (const t of treksWithCat) {
      trekCategoryMap.set(t.slug, t.category?.slug || "treks");
    }
  }
  function trekLink(slug: string): string {
    return `/${trekCategoryMap.get(slug) || "treks"}/${slug}`;
  }

  const difficultyMeta: Record<string, { color: string; bg: string; label: string }> = {
    easy: { color: "#15803d", bg: "#dcfce7", label: "Easy" },
    moderate: { color: "#b45309", bg: "#fef3c7", label: "Moderate" },
    challenging: { color: "#dc2626", bg: "#fce7f3", label: "Challenging" },
    difficult: { color: "#7c3aed", bg: "#ede9fe", label: "Difficult" },
    strenuous: { color: "#be123c", bg: "#ffe4e6", label: "Strenuous" },
  };

  return (
    <div className="min-h-screen relative" style={{ background: "var(--color-background)" }}>
      {/* Decorative background accents */}
      <div
        className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-primary), transparent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full opacity-[0.05] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-secondary), transparent)" }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[600px] -translate-x-1/2 rounded-full opacity-[0.03] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
      />

      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div
          className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-3xl border p-6 shadow-sm sm:flex-row sm:items-center"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {/* Decorative header accent */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10"
            style={{ background: "var(--color-primary)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full opacity-10"
            style={{ background: "var(--color-accent)" }}
          />
          <div>
            <div
              className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-primary)" }}
            >
              <Compass className="h-4 w-4" /> Customer Portal
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-secondary-dark)" }}>
              Welcome back, {(session.user.name || session.user.email || "").split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Track your Himalayan expeditions, payments, and itinerary schedules in real-time.
            </p>
          </div>
          <Link
            href="/treks"
            className="relative flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
          >
            Explore New Treks
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div
            className="relative overflow-hidden rounded-3xl border py-20 text-center"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {/* Decorative accents */}
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-[0.08]"
              style={{ background: "radial-gradient(circle, var(--color-primary), transparent)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full opacity-[0.06]"
              style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
            />
            <div
              className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))" }}
            >
              <Mountain className="h-12 w-12 text-white" />
              <span
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs shadow-sm"
                style={{ background: "var(--color-accent)" }}
              >
                <Compass className="h-3 w-3" style={{ color: "var(--color-secondary-dark)" }} />
              </span>
            </div>
            <h2 className="relative mt-6 text-xl font-bold" style={{ color: "var(--color-secondary-dark)" }}>
              No bookings yet
            </h2>
            <p className="relative mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Start your adventure by booking a trekking package.
            </p>
            <Link
              href="/treks"
              className="relative mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
            >
              Browse Treks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* ── Quick Stats Grid ── */}
            <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Subtle background divider */}
              <div
                className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px lg:block"
                style={{ background: "linear-gradient(90deg, transparent, var(--color-border), transparent)" }}
              />
              <StatCard
                icon={<Compass className="h-6 w-6" style={{ color: "var(--color-primary)" }} />}
                iconBg="var(--color-accent-light)"
                label="Total Treks"
                value={String(bookings.length)}
                sub={`${upcoming.length} active`}
                subColor="var(--color-success)"
              />
              <StatCard
                icon={<CheckCircle2 className="h-6 w-6" style={{ color: "var(--color-success)" }} />}
                iconBg="#dcfce7"
                label="Total Paid"
                value={`$${totalPaid.toLocaleString()}`}
                sub="Secure transactions"
              />
              <StatCard
                icon={<Wallet className="h-6 w-6" style={{ color: "var(--color-warning)" }} />}
                iconBg="var(--color-accent-light)"
                label="Remaining Due"
                value={`$${totalRemaining.toLocaleString()}`}
                sub={totalRemaining > 0 ? "Due before departure" : "All settled"}
                subColor="var(--color-warning)"
                valueColor={totalRemaining > 0 ? "var(--color-warning)" : undefined}
              />
              <StatCard
                icon={<Calendar className="h-6 w-6" style={{ color: "var(--color-accent-dark)" }} />}
                iconBg="var(--color-surface-alt)"
                label="Next Departure"
                value={featured ? formatDate(featured.startDate) : "—"}
                sub={featured ? `${daysAway(featured.startDate)} days away` : "No trips scheduled"}
                subColor="var(--color-primary)"
                small
              />
            </div>

            {/* ── Main Split ── */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left: featured expedition + upcoming list */}
              <div className="space-y-8 lg:col-span-2">
                {featured && (
                  <div
                    className="relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    {/* Decorative accents */}
                    <div
                      className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-[0.06]"
                      style={{ background: "radial-gradient(circle, var(--color-primary), transparent)" }}
                    />
                    <div
                      className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full opacity-[0.04]"
                      style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }}
                    />
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                          style={statusStyles[featured.status] || {}}
                        >
                          {featured.status.replace(/_/g, " ")}
                        </span>
                        <h2 className="mt-2 text-xl font-bold sm:text-2xl" style={{ color: "var(--color-secondary-dark)" }}>
                          {featured.trekTitle}
                        </h2>
                      </div>
                      {featured.region && (
                        <span
                          className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium"
                          style={{ background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
                        >
                          <MapPin className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                          {featured.region}
                        </span>
                      )}
                    </div>

                    <div
                      className="grid grid-cols-2 gap-4 border-y py-4 text-sm sm:grid-cols-3"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <div>
                        <p style={{ color: "var(--color-text-muted)" }}>Start Date</p>
                        <p className="mt-0.5 font-semibold" style={{ color: "var(--color-foreground)" }}>
                          {formatDate(featured.startDate)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--color-text-muted)" }}>Group Size</p>
                        <p className="mt-0.5 font-semibold" style={{ color: "var(--color-foreground)" }}>
                          {featured.groupSize} traveler{featured.groupSize > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--color-text-muted)" }}>Booked On</p>
                        <p className="mt-0.5 font-semibold" style={{ color: "var(--color-foreground)" }}>
                          {new Date(featured.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Payment progress */}
                    <div
                      className="mt-6 space-y-3 rounded-2xl border p-5"
                      style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-semibold" style={{ color: "var(--color-foreground)" }}>
                          Payment Breakdown
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}>
                          Paid: <strong style={{ color: "var(--color-foreground)" }}>${featuredPaid.toLocaleString()}</strong>{" "}
                          / Total: <strong style={{ color: "var(--color-foreground)" }}>${featuredTotal.toLocaleString()}</strong>
                        </span>
                      </div>

                      <div
                        className="h-3 w-full overflow-hidden rounded-full"
                        style={{ background: "var(--color-border)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${featuredProgress}%`, background: "var(--color-success)" }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span style={{ color: "var(--color-text-muted)" }}>{featuredProgress}% Paid</span>
                        {featuredRemaining > 0 ? (
                          <span className="font-medium" style={{ color: "var(--color-warning)" }}>
                            Remaining Balance: ${featuredRemaining.toLocaleString()}
                          </span>
                        ) : (
                          <span className="font-medium" style={{ color: "var(--color-success)" }}>
                            Fully paid
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {featuredRemaining > 0 && (
                        <Link
                          href={`/payment/${featured.id}`}
                          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90"
                          style={{ background: "var(--color-secondary)" }}
                        >
                          <CreditCard className="h-4 w-4" /> Pay Remaining Balance
                        </Link>
                      )}
                      <Link
                        href={`${trekLink(featured.trekSlug)}#itinerary`}
                        className="flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                      >
                        <Download className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                        View Itinerary
                      </Link>
                    </div>
                  </div>
                )}

                {/* Upcoming & Reserved Treks list */}
                {restUpcoming.length > 0 && (
                  <div
                    className="relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    {/* Accent top border */}
                    <div
                      className="absolute left-0 right-0 top-0 h-1"
                      style={{ background: "linear-gradient(90deg, var(--color-warning), var(--color-accent))" }}
                    />
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-[0.05]"
                      style={{ background: "radial-gradient(circle, var(--color-warning), transparent)" }}
                    />
                    <h3
                      className="mb-4 flex items-center gap-2 text-lg font-bold"
                      style={{ color: "var(--color-secondary-dark)" }}
                    >
                      <Clock className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
                      Upcoming &amp; Reserved Treks
                    </h3>
                    <div className="space-y-4">
                      {restUpcoming.map((b) => {
                        const ps = b.paymentStatus || "PENDING";
                        const remaining = Math.max(0, (b.totalPrice || 0) - paidAmountFor(b));
                        return (
                          <div
                            key={b.id}
                            className="flex flex-col items-start justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center"
                            style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
                          >
                            <div>
                              <h4 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
                                {b.trekTitle}
                              </h4>
                              <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                                Scheduled: {formatDate(b.startDate)}
                              </p>
                            </div>
                            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                              <div className="text-right">
                                <span className="block text-xs" style={{ color: "var(--color-text-muted)" }}>
                                  Due Amount
                                </span>
                                <span className="font-bold" style={{ color: "var(--color-foreground)" }}>
                                  ${remaining.toLocaleString()}
                                </span>
                              </div>
                              <span
                                className="rounded-xl px-3 py-1 text-xs font-semibold"
                                style={paymentStyles[ps] || {}}
                              >
                                {paymentLabels[ps] || ps}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: sidebar */}
              <div className="space-y-8">
                {/* Invoice Ledger */}
                <div
                  className="relative overflow-hidden rounded-3xl border p-6 shadow-sm"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  {/* Accent top border */}
                  <div
                    className="absolute left-0 right-0 top-0 h-1"
                    style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-secondary))" }}
                  />
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-[0.05]"
                    style={{ background: "radial-gradient(circle, var(--color-primary), transparent)" }}
                  />
                  <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--color-secondary-dark)" }}>
                    Invoice Ledger
                  </h3>
                  <div className="space-y-3 text-sm">
                    {bookings.slice(0, 6).map((b) => {
                      const ps = b.paymentStatus || "PENDING";
                      const paid = ps === "FULLY_PAID";
                      return (
                        <div
                          key={b.id}
                          className="flex justify-between border-b pb-3 last:border-b-0 last:pb-0"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          <span className="truncate pr-2" style={{ color: "var(--color-text-muted)" }}>
                            {b.trekTitle}
                          </span>
                          <span
                            className="shrink-0 font-semibold"
                            style={{ color: paid ? "var(--color-success)" : "var(--color-warning)" }}
                          >
                            ${b.totalPrice.toLocaleString()} ({paid ? "Paid" : "Pending"})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <Link
                    href="/dashboard/invoices"
                    className="mt-4 block rounded-2xl border py-2.5 text-center text-sm font-medium transition-all hover:opacity-80"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
                  >
                    View All Invoices
                  </Link>
                </div>

                {/* Completed Treks */}
                {completed.length > 0 && (
                  <div
                    className="relative overflow-hidden rounded-3xl border p-6 shadow-sm"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    {/* Accent top border */}
                    <div
                      className="absolute left-0 right-0 top-0 h-1"
                      style={{ background: "linear-gradient(90deg, var(--color-success), var(--color-primary-light))" }}
                    />
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-[0.05]"
                      style={{ background: "radial-gradient(circle, var(--color-success), transparent)" }}
                    />
                    <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--color-secondary-dark)" }}>
                      Completed Adventures
                    </h3>
                    <div className="space-y-4">
                      {completed.map((b) => (
                        <div
                          key={b.id}
                          className="rounded-2xl border p-4"
                          style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                                {b.trekTitle}
                              </h4>
                              <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                                {formatDate(b.startDate)}
                              </p>
                            </div>
                            <span
                              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                              style={statusStyles[b.status] || {}}
                            >
                              {b.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <Link
                            href={`${trekLink(b.trekSlug)}#reviews`}
                            className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: "var(--color-warning)" }}
                          >
                            <Star className="h-3 w-3" />
                            Write Review
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Support box */}
                <div
                  className="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))" }}
                >
                  {/* Decorative circles */}
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20"
                    style={{ background: "var(--color-primary)" }}
                  />
                  <div
                    className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full opacity-15"
                    style={{ background: "var(--color-accent)" }}
                  />

                  <div className="relative">
                    <div
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm"
                    >
                      <Compass className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold">Need Trip Adjustments?</h3>
                    <p className="mb-4 mt-1.5 text-xs leading-relaxed opacity-90">
                      Have questions regarding gear lists, permits, or upgrading your accommodation package? Our Sherpa
                      team is here to help.
                    </p>
                    <Link
                      href="/contact"
                      className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold shadow-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                      style={{ background: "var(--color-primary)" }}
                    >
                      Contact Trek Expert
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Recommended Treks ── */}
            {recommended.length > 0 && (
              <section>
                <div className="relative mb-6 flex items-center gap-3">
                  <div
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
                  >
                    <Sparkles className="h-5 w-5 text-white" />
                    <span
                      className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-white"
                      style={{ background: "var(--color-accent)" }}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "var(--color-secondary-dark)" }}>
                      Recommended for You
                    </h2>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Based on your trekking preferences
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {recommended.map((trek) => {
                    const diff = (trek.difficulty || "").toLowerCase();
                    const dm = difficultyMeta[diff] || {
                      color: "var(--color-secondary)",
                      bg: "var(--color-surface-alt)",
                      label: trek.difficulty || "Unknown",
                    };
                    return (
                      <Link
                        key={trek.slug}
                        href={`/${trek.category?.slug || "treks"}/${trek.slug}`}
                        className="group relative overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                      >
                        {/* Difficulty color bar */}
                        <div
                          className="absolute left-0 right-0 top-0 h-1.5"
                          style={{ background: dm.color }}
                        />

                        {/* Top section with gradient overlay */}
                        <div
                          className="p-5 pb-0"
                        >
                          {/* Difficulty badge */}
                          <div className="mb-3 flex items-center justify-between">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                              style={{ background: dm.bg, color: dm.color }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: dm.color }}
                              />
                              {dm.label}
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              {trek.duration} days
                            </span>
                          </div>

                          {/* Trek title */}
                          <h3
                            className="text-base font-bold transition-colors group-hover:text-primary"
                            style={{ color: "var(--color-secondary-dark)" }}
                          >
                            {trek.title}
                          </h3>

                          {/* Region */}
                          {trek.region && (
                            <p
                              className="mt-1 flex items-center gap-1 text-xs"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              <MapPin className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                              {trek.region}
                            </p>
                          )}
                        </div>

                        {/* Bottom section */}
                        <div
                          className="mt-4 flex items-center justify-between border-t px-5 py-4"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          <div>
                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                              From
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span
                                className="text-xl font-extrabold"
                                style={{ color: "var(--color-primary)" }}
                              >
                                ${trek.price.toLocaleString()}
                              </span>
                              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                /person
                              </span>
                            </div>
                          </div>
                          <div
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all group-hover:gap-2.5"
                            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
                          >
                            View
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>

                        {/* Decorative corner accent */}
                        <div
                          className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 transition-all group-hover:opacity-10"
                          style={{ background: "var(--color-primary)" }}
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  subColor,
  valueColor,
  small,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  valueColor?: string;
  small?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-3xl border p-6 shadow-sm"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
        <h3
          className={small ? "mt-1 text-lg font-bold" : "mt-1 text-2xl font-bold"}
          style={{ color: valueColor || "var(--color-secondary-dark)" }}
        >
          {value}
        </h3>
        {sub && (
          <span className="mt-1 inline-block text-xs font-medium" style={{ color: subColor || "var(--color-text-muted)" }}>
            {sub}
          </span>
        )}
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: iconBg }}>
        {icon}
      </div>
    </div>
  );
}