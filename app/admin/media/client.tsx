"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Trash2, Upload, X, Search, Check, Loader2, Grid3X3, List as ListIcon } from "lucide-react";
import { deleteMedia, uploadMedia, updateMediaAlt } from "./actions";
import { formatDate } from "@/lib/utils";

export function AdminMediaClient({ media }: { media: any[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<any>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [altValue, setAltValue] = useState("");

  const filtered = media.filter(
    (m) =>
      m.filename?.toLowerCase().includes(search.toLowerCase()) ||
      m.alt?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    try {
      await uploadMedia(fd);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    await deleteMedia(id);
    setPreview(null);
    router.refresh();
  }

  async function handleSaveAlt(id: string) {
    await updateMediaAlt(id, altValue);
    setEditingAlt(null);
    router.refresh();
  }

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "—";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-teal-50 text-teal-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-teal-50 text-teal-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs placeholder-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="ml-auto">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-16 text-center rounded-2xl border border-slate-200 bg-white">
          <ImageIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">No media found</p>
          <p className="mt-1 text-xs text-slate-400">
            {search ? "Try a different search." : "Upload images to get started."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              onClick={() => setPreview(file)}
            >
              {file.url ? (
                <div className="aspect-square bg-slate-100">
                  {file.mimeType?.startsWith("video/") ? (
                    <video src={file.url} className="h-full w-full object-cover" />
                  ) : (
                    <img
                      src={file.url}
                      alt={file.alt || ""}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-slate-100">
                  <ImageIcon className="h-12 w-12 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs font-medium text-white drop-shadow-sm">{file.filename}</p>
                {file.width && file.height && (
                  <p className="text-[10px] text-white/80">{file.width} &times; {file.height}</p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-500 opacity-0 shadow-sm backdrop-blur transition-all hover:bg-white group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {file.mimeType?.startsWith("image/") && (
                <div className="absolute left-2 top-2 rounded-lg bg-black/50 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {file.width}&times;{file.height}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">File</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Alt Text</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Size</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dimensions</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Uploaded</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((file) => (
                  <tr key={file.id} className="transition-colors hover:bg-slate-50/50 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {file.url ? (
                            <img src={file.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{file.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingAlt === file.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={altValue}
                            onChange={(e) => setAltValue(e.target.value)}
                            className="w-28 rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                            autoFocus
                          />
                          <button onClick={() => handleSaveAlt(file.id)} className="text-teal-600 hover:text-teal-700">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingAlt(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingAlt(file.id); setAltValue(file.alt || ""); }}
                          className="text-xs text-slate-500 hover:text-teal-600"
                        >
                          {file.alt || <span className="italic text-slate-300">Add alt text</span>}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatSize(file.filesize)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {file.width && file.height ? `${file.width}×${file.height}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-slate-500 font-mono">{file.mimeType?.split("/").pop() || "—"}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setPreview(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                          title="Preview"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          title="Delete"
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
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="mx-4 max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{preview.filename}</p>
                <p className="text-xs text-slate-400">
                  {preview.width && preview.height ? `${preview.width}×${preview.height} · ` : ""}
                  {formatSize(preview.filesize)} · {preview.mimeType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { handleDelete(preview.id); }}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(preview.url); }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Copy URL
                </button>
                <button onClick={() => setPreview(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center bg-slate-100 p-4">
              {preview.mimeType?.startsWith("video/") ? (
                <video src={preview.url} controls className="max-h-[60vh] max-w-full rounded-lg" />
              ) : (
                <img src={preview.url} alt={preview.alt || ""} className="max-h-[60vh] max-w-full rounded-lg object-contain" />
              )}
            </div>
            {preview.alt && (
              <div className="border-t border-slate-200 px-5 py-3">
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Alt:</span> {preview.alt}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
