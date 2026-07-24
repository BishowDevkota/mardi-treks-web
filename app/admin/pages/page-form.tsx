"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPage, updatePage, deletePage } from "./actions";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/admin/RichTextEditor";
import { ImageUpload, type ImageUploadHandle } from "@/components/admin/trek-sections/ImageUpload";

export function PageForm({ mode, page }: { mode: "create" | "edit"; page?: any }) {
  const router = useRouter();
  const [content, setContent] = useState(page?.content || "");
  const [heroImage, setHeroImage] = useState(page?.heroImage || "");
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const heroImageRef = useRef<ImageUploadHandle>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);

    // Process pending editor images before saving
    const [uploadedHeroImage, finalContent] = await Promise.all([
      heroImageRef.current?.save() ?? Promise.resolve(null),
      editorRef.current?.processPendingImages() ?? Promise.resolve(content),
    ]);

    const fd = new FormData(form);
    fd.set("content", finalContent);
    fd.set("heroImage", uploadedHeroImage || heroImage);
    try {
      if (mode === "create") await createPage(fd);
      else if (page) await updatePage(page.id, fd);
    } catch { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Content</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500">Title *</label>
                <input
                  name="title"
                  defaultValue={page?.title || ""}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Slug *</label>
                <input
                  name="slug"
                  defaultValue={page?.slug || ""}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <p className="mt-1 text-xs text-slate-400">URL path: /{page?.slug || "your-slug"}</p>
              </div>
              <div>
                <ImageUpload
                  ref={heroImageRef}
                  value={heroImage}
                  onChange={setHeroImage}
                  label="Hero Image"
                  folder="mardi-treks/pages"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Hero Description</label>
                <textarea
                  name="heroDescription"
                  rows={3}
                  defaultValue={page?.heroDescription || ""}
                  placeholder="A short introduction shown below the page title."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Body</label>
                <RichTextEditor ref={editorRef} content={content} onChange={setContent} placeholder="Write page content..." />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Settings</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500">Status</label>
                <select
                  name="status"
                  defaultValue={page?.status || "draft"}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">SEO</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500">Meta Title</label>
                <input
                  name="metaTitle"
                  defaultValue={page?.metaTitle || ""}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Meta Description</label>
                <textarea
                  name="metaDescription"
                  rows={3}
                  defaultValue={page?.metaDescription || ""}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md disabled:opacity-50"
            >
              {saving ? "Saving..." : mode === "create" ? "Create Page" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/pages")}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            {mode === "edit" && page && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Delete this page?")) {
                    await deletePage(page.id);
                  }
                }}
                className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete Page
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
