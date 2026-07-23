"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";

export interface ImageUploadHandle {
  /** Mark the current image as saved so it won't be cleaned up on page unload */
  markSaved: () => void;
}

interface ImageUploadProps {
  value: string;          // current Cloudinary public ID or URL
  onChange: (id: string) => void;
  label?: string;
  folder?: string;
}

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(
  function ImageUpload({ value, onChange, label, folder }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    value ? `https://res.cloudinary.com/dk7ggjvlw/image/upload/${value}` : null
  );
  // Track whether the current value has been saved to the DB
  const isSavedRef = useRef(true);

  // Expose markSaved so the parent form can call it after a successful save
  useImperativeHandle(ref, () => ({
    markSaved() {
      isSavedRef.current = true;
    },
  }));

  // When value changes to a new upload (via onChange), mark as unsaved
  // We detect this by comparing preview state changes
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      // Value changed externally (e.g. via upload or clear)
      if (value === "") {
        // Cleared — nothing to track
        isSavedRef.current = true;
      } else {
        // New image uploaded — mark as unsaved
        isSavedRef.current = false;
      }
      prevValueRef.current = value;
    }
  }, [value]);

  // Clean up unsaved images when the user navigates away without saving
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isSavedRef.current && value) {
        navigator.sendBeacon(
          "/api/delete-image",
          JSON.stringify({ publicId: value })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [value]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder || "mardi-treks");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (data.publicId) {
        onChange(data.publicId);
        setPreview(`https://res.cloudinary.com/dk7ggjvlw/image/upload/${data.publicId}`);
      } else if (data.url) {
        onChange(data.url);
        setPreview(data.url);
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
    setUploading(false);
  }

  async function handleClear() {
    // Delete the image from Cloudinary if it hasn't been saved yet
    if (!isSavedRef.current && value) {
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

  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>}

      {preview ? (
        <div className="relative group overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-32 w-full object-cover" />
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
