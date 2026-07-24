import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, UserPlus, Users, MapPin, CheckCircle } from "lucide-react";
import { CrmTravellersClient } from "./client";

export default async function CrmTravellersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [travellers, totalCount, autoTrackedCount] = await Promise.all([
    prisma.traveller.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        contact: { select: { name: true, email: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.traveller.count(),
    prisma.traveller.count({ where: { autoTracked: true } }),
  ]);

  // Get all treks for reference
  const treks = await prisma.trek.findMany({
    where: { status: "published" },
    select: { id: true, title: true, slug: true, duration: true, difficulty: true },
    orderBy: { title: "asc" },
  });

  // Enrich travellers with completed trek data
  const enrichedTravellers = travellers.map((t) => {
    const completedIds: string[] = t.completedTrekIds ? JSON.parse(t.completedTrekIds) : [];
    const completedTreks = treks.filter((tr) => completedIds.includes(tr.id) || completedIds.includes(tr.slug));
    return { ...t, completedTreks };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Travellers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track travellers and their completed treks
          </p>
        </div>
        <Link
          href="/admin/crm/travellers/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Traveller
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2"><Users className="h-4 w-4 text-teal-600" /></div>
            <div>
              <p className="text-lg font-bold text-slate-900">{totalCount}</p>
              <p className="text-xs text-slate-500">Total Travellers</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2"><CheckCircle className="h-4 w-4 text-emerald-600" /></div>
            <div>
              <p className="text-lg font-bold text-slate-900">{autoTrackedCount}</p>
              <p className="text-xs text-slate-500">Auto-tracked (from bookings)</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2"><MapPin className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-lg font-bold text-slate-900">{treks.length}</p>
              <p className="text-xs text-slate-500">Available Treks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Travellers List */}
      <CrmTravellersClient
        travellers={JSON.parse(JSON.stringify(enrichedTravellers))}
        treks={JSON.parse(JSON.stringify(treks))}
        searchQuery={q || ""}
      />
    </div>
  );
}
