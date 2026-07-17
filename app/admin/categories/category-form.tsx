"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "./actions";

export function CategoryForm({ mode, category }: { mode: "create" | "edit"; category?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") await createCategory(new FormData(e.currentTarget));
      else if (category) await updateCategory(category.id, new FormData(e.currentTarget));
    } catch { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-lg">📂</div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Category Details</h2>
            <p className="text-xs text-slate-400">Define a product category like Treks, Tours, Climbing</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Name *</label>
            <input name="name" defaultValue={category?.name || ""} required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Slug *</label>
            <input name="slug" defaultValue={category?.slug || ""} required placeholder="e.g. treks, tours, climbing"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
            <p className="mt-1 text-xs text-slate-400">URL path: /{category?.slug || "your-slug"}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Icon (emoji)</label>
              <input name="icon" defaultValue={category?.icon || ""} placeholder="🏔️" maxLength={2}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-lg focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Sort Order</label>
              <input name="sort" type="number" defaultValue={category?.sort || 0}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
            <textarea name="description" rows={3} defaultValue={category?.description || ""}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-teal-700 disabled:opacity-50">
          {saving ? "Saving..." : mode === "create" ? "Create Category" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.push("/admin/categories")}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
        {mode === "edit" && category && (
          <button type="button" onClick={async () => { if (confirm("Delete?")) await deleteCategory(category.id); }}
            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
        )}
      </div>
    </form>
  );
}
