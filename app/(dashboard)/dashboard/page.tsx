import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mountain, Calendar, Users as UsersIcon, DollarSign, Clock, Star, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { payment: true },
    orderBy: { startDate: "desc" },
  });

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => new Date(b.startDate) >= now || b.status === "CONFIRMED" || b.status === "PENDING_REVIEW" || b.status === "AWAITING_PAYMENT");
  const completedBookings = bookings.filter((b) => new Date(b.startDate) < now && (b.status === "CONFIRMED" || b.status === "COMPLETED"));

  // Recommendation: find treks based on user's booked treks' regions
  const bookedSlugs = bookings.map((b) => b.trekSlug);
  let recommendedTreks: any[] = [];

  if (bookedSlugs.length > 0) {
    // Get the categories/regions of treks the user booked
    const bookedTreks = await prisma.trek.findMany({
      where: { slug: { in: bookedSlugs } },
      select: { region: true, categoryId: true },
    });

    const regions = [...new Set(bookedTreks.map((t) => t.region).filter(Boolean))];
    const categoryIds = [...new Set(bookedTreks.map((t) => t.categoryId).filter(Boolean))];

    recommendedTreks = await prisma.trek.findMany({
      where: {
        status: "published",
        slug: { notIn: bookedSlugs },
        OR: [
          regions.length > 0 ? { region: { in: regions as string[] } } : {},
          categoryIds.length > 0 ? { categoryId: { in: categoryIds as string[] } } : {},
        ].filter((cond) => Object.keys(cond).length > 0),
      },
      select: {
        slug: true,
        title: true,
        price: true,
        duration: true,
        difficulty: true,
        region: true,
        heroImage: true,
        category: { select: { slug: true } },
      },
      take: 3,
    });
  }

  // Fallback: if no recommended treks, show popular ones
  if (recommendedTreks.length === 0) {
    recommendedTreks = await prisma.trek.findMany({
      where: {
        status: "published",
        slug: { notIn: bookedSlugs },
      },
      select: {
        slug: true,
        title: true,
        price: true,
        duration: true,
        difficulty: true,
        region: true,
        heroImage: true,
        category: { select: { slug: true } },
      },
      take: 3,
      orderBy: { reviews: { _count: "desc" } },
    });
  }

  const statusColors: Record<string, string> = {
    PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
    AWAITING_PAYMENT: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    COMPLETED: "bg-slate-100 text-slate-700",
  };

  const paymentStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PARTIALLY_PAID: "bg-blue-100 text-blue-700",
    FULLY_PAID: "bg-green-100 text-green-700",
  };

  const paymentStatusLabels: Record<string, string> = {
    PENDING: "Payment Pending",
    PARTIALLY_PAID: "Partially Paid",
    FULLY_PAID: "Fully Paid",
  };

  function needsPayment(paymentStatus: string) {
    return paymentStatus === "PENDING" || paymentStatus === "PARTIALLY_PAID";
  }

  function BookingCard({ booking, highlight = false }: { booking: any; highlight?: boolean }) {
    const ps = booking.paymentStatus || "PENDING";
    const paymentMethod = booking.payment?.method;
    const isCompleted = new Date(booking.startDate) < now && (booking.status === "CONFIRMED" || booking.status === "COMPLETED");

    return (
      <div className={`rounded-xl border ${highlight ? "border-teal-300 bg-gradient-to-r from-teal-50 to-white ring-1 ring-teal-200" : "border-border bg-white"} p-6 shadow-sm`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {highlight && <Sparkles className="h-5 w-5 text-teal-500" />}
              <h3 className={`text-lg font-semibold ${highlight ? "text-teal-900" : "text-foreground"}`}>
                {booking.trekTitle}
              </h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusColors[ps] || "bg-slate-100 text-slate-700"}`}>
                {paymentStatusLabels[ps] || ps}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(booking.startDate).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <UsersIcon className="h-4 w-4" />
                {booking.groupSize} traveler{booking.groupSize > 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ${booking.totalPrice.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(booking.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status] || "bg-slate-100 text-slate-700"}`}>
              {booking.status.replace(/_/g, " ")}
            </span>
            {isCompleted ? (
              <Link
                href={`/${booking.trekSlug.startsWith("everest") ? "trekking" : booking.trekSlug.startsWith("annapurna") ? "trekking" : "trekking"}/${booking.trekSlug}#reviews`}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
              >
                <Star className="h-3.5 w-3.5" /> Write Review
              </Link>
            ) : needsPayment(ps) ? (
              <div className="flex flex-col gap-1.5">
                <Link href={`/payment/${booking.id}`} className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">
                  Pay Now
                </Link>
                {paymentMethod === "esewa" && (
                  <Link href={`/payment/${booking.id}/processing?method=esewa`} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Verify Payment
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
      <p className="mt-2 text-text-muted">Welcome back, {session.user.name || session.user.email}</p>

      {bookings.length === 0 ? (
        <div className="mt-12 text-center">
          <Mountain className="mx-auto h-16 w-16 text-text-muted/50" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">No bookings yet</h2>
          <p className="mt-2 text-text-muted">Start your adventure by booking a trekking package.</p>
          <Link href="/treks" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
            Browse Treks
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Upcoming Treks */}
          {upcomingBookings.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-4">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                Upcoming Treks
              </h2>
              <div className="space-y-4">
                {upcomingBookings.map((booking, i) => (
                  <BookingCard key={booking.id} booking={booking} highlight={i === 0} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Treks */}
          {completedBookings.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-4">
                <Star className="h-5 w-5 text-amber-500" />
                Completed Treks
              </h2>
              <div className="space-y-4">
                {completedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {/* Recommended Treks */}
          {recommendedTreks.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-4">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Recommended for You
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedTreks.map((trek) => (
                  <Link
                    key={trek.slug}
                    href={`/${trek.category?.slug || "treks"}/${trek.slug}`}
                    className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-teal-300 hover:shadow-md"
                  >
                    <h3 className="font-semibold text-foreground group-hover:text-teal-700">{trek.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span>{trek.duration} days</span>
                      <span className="capitalize">{trek.difficulty}</span>
                      {trek.region && <span className="capitalize">{trek.region}</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-teal-600">${trek.price.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
