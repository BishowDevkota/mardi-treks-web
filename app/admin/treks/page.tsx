import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, ExternalLink, List, TrendingUp, DollarSign, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { AdminTreksClient } from "./client";

export default async function AdminTreksPage() {
  const treks = await prisma.trek.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reviews: true } },
      category: { select: { name: true, slug: true, icon: true } },
    },
  });

  const stats = {
    total: treks.length,
    published: treks.filter((t) => t.status === "published").length,
    draft: treks.filter((t) => t.status === "draft").length,
    archived: treks.filter((t) => t.status === "archived").length,
    avgPrice: treks.length > 0 ? Math.round(treks.reduce((a, t) => a + t.price, 0) / treks.length) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">{treks.length} products across all categories</p>
        </div>
        <Link
          href="/admin/treks/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" /> New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2"><List className="h-4 w-4 text-teal-600" /></div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.published}</p>
              <p className="text-xs text-slate-500">Published</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2"><MapPin className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-lg font-bold text-slate-900">{stats.draft}</p>
              <p className="text-xs text-slate-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2"><DollarSign className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-lg font-bold text-slate-900">{formatPrice(stats.avgPrice)}</p>
              <p className="text-xs text-slate-500">Avg. Price</p>
            </div>
          </div>
        </div>
      </div>

      {/* Treks List */}
      <AdminTreksClient treks={JSON.parse(JSON.stringify(treks))} />
    </div>
  );
}
