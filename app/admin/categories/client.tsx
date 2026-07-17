"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Layers } from "lucide-react";
import { deleteCategory } from "./actions";

export function AdminCategoriesClient({ categories }: { categories: any[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Treks in it will not be deleted.")) return;
    await deleteCategory(id);
    router.refresh();
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
          <Layers className="h-6 w-6 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No categories yet</h3>
        <p className="mt-1 text-sm text-slate-500">Create your first category to organize your treks.</p>
        <Link
          href="/admin/categories/new"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-teal-700"
        >
          + New Category
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Slug</th>
            <th className="px-5 py-3 text-center">Treks</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <tr key={cat.id} className="group hover:bg-slate-50/50">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon || "📁"}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-slate-400">{cat.description}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                  /{cat.slug}
                </code>
              </td>
              <td className="px-5 py-4 text-center">
                <span className="inline-flex items-center justify-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-600">
                  {cat._count?.treks ?? 0}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/categories/${cat.id}`}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
