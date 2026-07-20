import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ShoppingCart, CheckCircle2, Clock, Ban, AlertCircle,
  DollarSign, TrendingUp, Search, ArrowUpRight, Eye, Trash2,
  Filter
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { AdminBookingsClient } from "./client";

const statusStyles: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-200",
  AWAITING_PAYMENT: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200 ring-red-200",
  COMPLETED: "bg-slate-50 text-slate-600 border-slate-200 ring-slate-200",
};

const statusIcons: Record<string, string> = {
  PENDING_REVIEW: "AlertCircle",
  AWAITING_PAYMENT: "Clock",
  CONFIRMED: "CheckCircle2",
  CANCELLED: "Ban",
  COMPLETED: "CheckCircle2",
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: statusFilter, q: searchQuery } = await searchParams;

  const where: any = {};
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }
  if (searchQuery) {
    where.OR = [
      { trekTitle: { contains: searchQuery, mode: "insensitive" } },
      { user: { name: { contains: searchQuery, mode: "insensitive" } } },
      { user: { email: { contains: searchQuery, mode: "insensitive" } } },
    ];
  }

  const [bookings, stats] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        payment: { select: { method: true, status: true, amount: true } },
        travelerDetails: {
          select: { fullName: true, email: true, phone: true, nationality: true, passportNumber: true, age: true },
        },
      },
    }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
  ]);

  const totalRevenue = stats._sum.totalPrice || 0;

  const statusCounts = {
    all: bookings.length,
    PENDING_REVIEW: bookings.filter((b) => b.status === "PENDING_REVIEW").length,
    CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
    COMPLETED: bookings.filter((b) => b.status === "COMPLETED").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
    AWAITING_PAYMENT: bookings.filter((b) => b.status === "AWAITING_PAYMENT").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer bookings and reservations
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">${totalRevenue.toLocaleString()}</span>
          <span className="text-xs text-emerald-500">revenue</span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <AdminBookingsClient
        bookings={JSON.parse(JSON.stringify(bookings))}
        statusCounts={statusCounts}
        currentStatus={statusFilter || "all"}
        searchQuery={searchQuery || ""}
        statusStyles={statusStyles}
        statusIcons={statusIcons}
      />
    </div>
  );
}
