"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useGalleryLightbox } from "./GalleryContext";

interface GalleryImage {
  id?: string;
  imageId: string;
  alt: string | null;
  caption: string | null;
}

interface GallerySectionProps {
  images: GalleryImage[];
  title?: string;
  heading?: string;
  description?: string;
  trekTitle?: string;
  className?: string;
}

export default function GallerySection({
  images,
  heading = "Gallery",
  description,
  trekTitle = "",
  className = "",
}: GallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { setLightboxOpen } = useGalleryLightbox();

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + images.length) % images.length
        );
      if (e.key === "ArrowRight")
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % images.length
        );
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    setLightboxOpen(lightboxIndex !== null);
  }, [lightboxIndex, setLightboxOpen]);

  if (!images?.length) return null;

  return (
    <section id="gallery" className={`py-16 ${className}`}>
      <h2
        className="mb-2 text-2xl font-bold"
        style={{ color: "var(--color-secondary)" }}
      >
        {heading}
      </h2>
      {description && (
        <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {description}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img: GalleryImage, idx: number) => (
          <button
            key={img.id || idx}
            type="button"
            onClick={() => setLightboxIndex(idx)}
            className="group relative overflow-hidden rounded-2xl text-left cursor-zoom-in"
            style={{
              backgroundColor: "var(--color-surface-alt)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/${img.imageId}`}
                alt={img.alt || `${trekTitle} photo`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            {img.caption && (
              <div className="px-3 py-2">
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {img.caption}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Previous button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                (prev) =>
                  prev === null
                    ? null
                    : (prev - 1 + images.length) % images.length
              );
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Next button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                (prev) =>
                  prev === null ? null : (prev + 1) % images.length
              );
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Image container */}
          <div
            className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center px-4 py-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-full w-full">
              <Image
                src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/${images[lightboxIndex].imageId}`}
                alt={images[lightboxIndex].alt || `${trekTitle} photo`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {images[lightboxIndex].caption && (
              <p className="mt-4 text-center text-sm text-white/80">
                {images[lightboxIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
