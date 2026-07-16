import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Mail, Calendar, ShoppingCart, Shield, UserCog } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AdminUsersClient } from "./client";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bookings: true } },
    },
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    customers: users.filter((u) => u.role === "customer").length,
    withBookings: users.filter((u) => u._count.bookings > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage registered users and their roles
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2">
              <Users className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.customers}</p>
              <p className="text-xs text-slate-500">Customers</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <Shield className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.admins}</p>
              <p className="text-xs text-slate-500">Admins</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.withBookings}</p>
              <p className="text-xs text-slate-500">With Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <AdminUsersClient users={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
