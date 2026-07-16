import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  List, FileText, ImageIcon, ShoppingCart, Users,
  TrendingUp, ArrowUpRight, DollarSign, Calendar,
  Clock, Star, MapPin, Activity, CheckCircle2,
  AlertCircle, Ban
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  AWAITING_PAYMENT: "bg-blue-50 text-blue-700 border-blue-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-slate-50 text-slate-600 border-slate-200",
};

const statusIcons: Record<string, any> = {
  PENDING_REVIEW: AlertCircle,
  AWAITING_PAYMENT: Clock,
  CONFIRMED: CheckCircle2,
  CANCELLED: Ban,
  COMPLETED: CheckCircle2,
};

export default async function AdminDashboard() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    trekCount, blogCount, bookingCount, userCount, mediaCount,
    publishedTreks, draftTreks,
    recentBookings, revenueData,
    confirmedBookings, pendingBookings, cancelledBookings, completedBookings,
    popularTreks,
  ] = await Promise.all([
    prisma.trek.count(),
    prisma.blogPost.count(),
    prisma.booking.count(),
    prisma.user.count(),
    prisma.media.count(),
    prisma.trek.count({ where: { status: "published" } }),
    prisma.trek.count({ where: { status: "draft" } }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" }, take: 6,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.groupBy({
      by: ["trekTitle"],
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const totalRevenue = revenueData._sum.totalPrice || 0;
  const conversionRate = bookingCount > 0
    ? Math.round(((confirmedBookings + completedBookings) / bookingCount) * 100)
    : 0;

  const statsCards = [
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      href: "/admin/bookings",
      gradient: "from-emerald-500 to-emerald-600",
      lightBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      change: "+12.5%",
      changeType: "up",
    },
    {
      label: "Bookings",
      value: bookingCount,
      icon: ShoppingCart,
      href: "/admin/bookings",
      gradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      iconColor: "text-blue-600",
      change: `${confirmedBookings} confirmed`,
      changeType: "neutral",
    },
    {
      label: "Treks",
      value: trekCount,
      icon: List,
      href: "/admin/treks",
      gradient: "from-violet-500 to-violet-600",
      lightBg: "bg-violet-50",
      iconColor: "text-violet-600",
      change: `${publishedTreks} published`,
      changeType: "neutral",
    },
    {
      label: "Users",
      value: userCount,
      icon: Users,
      href: "/admin/users",
      gradient: "from-rose-500 to-rose-600",
      lightBg: "bg-rose-50",
      iconColor: "text-rose-600",
      change: `${blogCount} blog posts`,
      changeType: "neutral",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(now)}
        </div>
      </div>

      {/* Stats Cards with Gradients */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-xl ${card.lightBg} p-2.5 ${card.iconColor} transition-transform group-hover:scale-110`}>
                <card.icon className="h-5 w-5" />
              </div>
              {card.change && (
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  card.changeType === "up" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
                }`}>
                  {card.changeType === "up" && <TrendingUp className="h-3 w-3" />}
                  {card.change}
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
            {/* Decorative gradient bar */}
            <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${card.gradient} transition-all duration-300 group-hover:w-full`} />
          </Link>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{confirmedBookings}</p>
              <p className="text-xs text-slate-500">Confirmed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{pendingBookings}</p>
              <p className="text-xs text-slate-500">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{conversionRate}%</p>
              <p className="text-xs text-slate-500">Conversion Rate</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-50 p-2">
              <ImageIcon className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{mediaCount}</p>
              <p className="text-xs text-slate-500">Media Files</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Bookings</h2>
              <p className="text-xs text-slate-500">Latest booking activity</p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              View all
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <ShoppingCart className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">No bookings yet</p>
              <p className="mt-1 text-xs text-slate-400">Bookings will appear here once customers start booking.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBookings.map((b) => {
                const StatusIcon = statusIcons[b.status] || AlertCircle;
                return (
                  <div key={b.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                      {b.groupSize}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{b.trekTitle}</p>
                      <p className="text-xs text-slate-500">
                        {b.user.name || b.user.email} &middot; {formatDate(b.startDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">${b.totalPrice.toLocaleString()}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles[b.status] || "bg-slate-50 text-slate-600"}`}>
                        <StatusIcon className="h-3 w-3" />
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Popular Treks */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Popular Treks</h2>
              <p className="text-xs text-slate-500">Most booked packages</p>
            </div>
            {popularTreks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No bookings data yet.</div>
            ) : (
              <div className="space-y-3 px-5 py-4">
                {popularTreks.map((trek, i) => {
                  const maxCount = popularTreks[0]._count.id;
                  const barWidth = maxCount > 0 ? (trek._count.id / maxCount) * 100 : 0;
                  return (
                    <div key={trek.trekTitle}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                          <span className="truncate text-slate-700 font-medium">{trek.trekTitle}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 ml-2">{trek._count.id} bookings</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
            </div>
            <div className="space-y-1 p-3">
              <QuickActionBtn href="/admin/treks/new" label="Create New Trek" desc="Add a new trekking package" color="emerald" />
              <QuickActionBtn href="/admin/blog/new" label="Write Blog Post" desc="Share a new story" color="blue" />
              <QuickActionBtn href="/admin/bookings" label="Manage Bookings" desc="Review pending requests" color="amber" />
              <QuickActionBtn href="/admin/media" label="Upload Media" desc="Add images to library" color="violet" />
            </div>
          </div>
        </div>
      </div>

      {/* Draft Reminder */}
      {draftTreks > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                You have {draftTreks} trek{draftTreks > 1 ? "s" : ""} in draft mode
              </p>
              <p className="text-xs text-amber-600">Publish them to make them visible on the site.</p>
            </div>
            <Link
              href="/admin/treks"
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-200 transition-colors"
            >
              View Treks
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickActionBtn({ href, label, desc, color }: {
  href: string; label: string; desc: string; color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: "from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-emerald-200/50",
    blue: "from-blue-50 to-blue-100/50 text-blue-700 hover:shadow-blue-200/50",
    amber: "from-amber-50 to-amber-100/50 text-amber-700 hover:shadow-amber-200/50",
    violet: "from-violet-50 to-violet-100/50 text-violet-700 hover:shadow-violet-200/50",
  };
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} px-4 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md`}
    >
      <span className="text-lg">{label.includes("Trek") ? "🏔️" : label.includes("Blog") ? "📝" : label.includes("Bookings") ? "📋" : "🖼️"}</span>
      <div>
        <p>{label}</p>
        <p className="text-xs opacity-70">{desc}</p>
      </div>
      <ArrowUpRight className="ml-auto h-4 w-4 opacity-50" />
    </Link>
  );
}
