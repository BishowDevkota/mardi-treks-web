"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, deletePost } from "./actions";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUpload } from "@/components/admin/trek-sections/ImageUpload";

export function BlogForm({ mode, post }: { mode: "create" | "edit"; post?: any }) {
  const router = useRouter();
  const [content, setContent] = useState(post?.content || "");
  const [heroImage, setHeroImage] = useState(post?.heroImage || "");
  const [ogImage, setOgImage] = useState(post?.ogImage || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("content", content);
    fd.set("heroImage", heroImage);
    fd.set("ogImage", ogImage);
    try {
      if (mode === "create") await createPost(fd);
      else if (post) await updatePost(post.id, fd);
    } catch { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Content */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg">📝</div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Content</h2>
                <p className="text-xs text-slate-400">Blog post details and body</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Title *</label>
                <input name="title" defaultValue={post?.title || ""} required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Slug *</label>
                  <input name="slug" defaultValue={post?.slug || ""} required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Author *</label>
                  <input name="author" defaultValue={post?.author || ""} required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Excerpt</label>
                <textarea name="excerpt" rows={2} defaultValue={post?.excerpt || ""} placeholder="Brief summary of the post..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <ImageUpload value={heroImage} onChange={setHeroImage} label="Hero Image" folder="mardi-treks/blog" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Body</label>
                <RichTextEditor content={content} onChange={setContent} placeholder="Write your blog post..." />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Settings */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-lg">⚙️</div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Settings</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Tags (JSON)</label>
                <input name="tags" defaultValue={post?.tags || "[]"} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
                <p className="mt-1 text-xs text-slate-400">e.g. ["trekking", "nepal", "everest"]</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                <select name="status" defaultValue={post?.status || "draft"} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </section>

          {/* SEO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 text-lg">🔍</div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">SEO</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Meta Title</label>
                <input name="metaTitle" defaultValue={post?.metaTitle || ""} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Meta Description</label>
                <textarea name="metaDescription" rows={3} defaultValue={post?.metaDescription || ""} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
              </div>
              <div>
                <ImageUpload value={ogImage} onChange={setOgImage} label="OG Image (social share)" folder="mardi-treks/blog" />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md disabled:opacity-50">
              {saving ? "Saving..." : mode === "create" ? "Publish" : "Save"}
            </button>
            <button type="button" onClick={() => router.push("/admin/blog")} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
            {mode === "edit" && post && (
              <button type="button" onClick={async () => { if (confirm("Delete this post?")) await deletePost(post.id); }} className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
