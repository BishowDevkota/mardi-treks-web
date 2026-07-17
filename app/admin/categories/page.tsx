import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Trash2, FolderKanban, Layers } from "lucide-react";
import { AdminCategoriesClient } from "./client";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: "asc" },
    include: { _count: { select: { treks: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">{categories.length} product categories</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-teal-700"
        >
          <Plus className="h-4 w-4" /> New Category
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Categories", value: categories.length, icon: FolderKanban, color: "bg-teal-50 text-teal-600" },
          { label: "Total Treks", value: categories.reduce((a, c) => a + c._count.treks, 0), icon: Layers, color: "bg-blue-50 text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${s.color}`}><s.icon className="h-4 w-4" /></div>
              <div>
                <p className="text-lg font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminCategoriesClient categories={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
