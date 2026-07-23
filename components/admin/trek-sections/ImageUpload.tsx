"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Upload, Loader2, X, ImageIcon, AlertCircle } from "lucide-react";

export interface ImageUploadHandle {
  /** Upload the pending file (if any) to Cloudinary, calls onChange with the publicId, returns it */
  save: () => Promise<string | null>;
  /** Whether there is a pending file that hasn't been uploaded to Cloudinary yet */
  hasPending: () => boolean;
}

interface ImageUploadProps {
  value: string;          // current Cloudinary public ID
  onChange: (id: string) => void;
  label?: string;
  folder?: string;
}

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(
  function ImageUpload({ value, onChange, label, folder }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    value ? `https://res.cloudinary.com/dk7ggjvlw/image/upload/${value}` : null
  );

  // Expose save and hasPending to the parent form
  useImperativeHandle(ref, () => ({
    async save() {
      if (!pendingFile) return null;
      return uploadPendingFile(pendingFile);
    },
    hasPending() {
      return pendingFile !== null;
    },
  }));

  async function uploadPendingFile(file: File): Promise<string | null> {
    setUploading(true);

    // If replacing an existing Cloudinary image, delete the old one first
    const oldValue = value;
    if (oldValue) {
      try {
        await fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: oldValue }),
        });
      } catch (err) {
        console.error("Failed to delete old image", err);
      }
    }

    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder || "mardi-treks");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      let newId = "";
      if (data.publicId) {
        newId = data.publicId;
        onChange(data.publicId);
        setPreview(`https://res.cloudinary.com/dk7ggjvlw/image/upload/${data.publicId}`);
      } else if (data.url) {
        newId = data.url;
        onChange(data.url);
        setPreview(data.url);
      }

      // Clean up pending state
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingFile(null);
      setPendingPreview(null);

      return newId;
    } catch (err) {
      console.error("Upload failed", err);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous pending preview URL
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);

    // Show local preview immediately — no Cloudinary upload yet
    const localUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingPreview(localUrl);
    // Don't call onChange yet — the parent will get the Cloudinary ID when save() is called
  }

  async function handleClear() {
    // If there's a pending file (not yet uploaded), just clear local state
    if (pendingFile) {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingFile(null);
      setPendingPreview(null);
      onChange("");
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Image was uploaded to Cloudinary — delete it
    if (value) {
      try {
        await fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: value }),
        });
      } catch (err) {
        console.error("Failed to delete image from Cloudinary", err);
      }
    }
    onChange("");
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // Determine which preview to show
  const activePreview = pendingPreview || preview;
  const hasPending = !!pendingFile;

  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>}

      {activePreview ? (
        <div className={`relative group overflow-hidden rounded-xl border bg-slate-100 ${hasPending ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activePreview} alt="" className="h-32 w-full object-cover" />
          {/* Pending badge */}
          {hasPending && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
              <AlertCircle className="h-3 w-3" />
              Unsaved
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white">
              {uploading ? "Uploading..." : "Change"}
            </button>
            <button type="button" onClick={handleClear}
              className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-teal-300 hover:bg-teal-50">
          {uploading ? (
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
              <p className="mt-1 text-xs text-slate-500">Uploading...</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-1 text-xs font-medium text-slate-500">Click to upload image</p>
              <p className="text-[10px] text-slate-400">PNG, JPG, WebP up to 10MB</p>
            </div>
          )}
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
});
