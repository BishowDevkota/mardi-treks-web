"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";

// Dynamic import with ssr:false — Mapbox GL JS is heavy and must not block LCP
const MapWithNoSSR = dynamic(
  () => import("./MapContent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[21/9] items-center justify-center bg-surface">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-text-muted">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface TrekMapProps {
  geoJsonUrl?: string;
  geoJsonData?: string | null;
  waypoints?: Array<{ lng: number; lat: number; label: string; description?: string }>;
  itinerary?: Array<{ dayNumber: number; title: string; elevation?: string | null }>;
  staticFallbackImage?: string;
  /** When set, the map starts already expanded (fullscreen) */
  startExpanded?: boolean;
  /** When set, clicking the minimize button calls this instead of toggling locally */
  onClose?: () => void;
}

export function TrekMap({
  geoJsonUrl,
  geoJsonData,
  waypoints,
  itinerary,
  staticFallbackImage,
  startExpanded,
  onClose,
}: TrekMapProps) {
  const [isExpanded, setIsExpanded] = useState(startExpanded ?? false);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border transition-all ${
        isExpanded ? "fixed inset-0 z-[60] shadow-2xl" : "relative"
      }`}
    >
      <div className={isExpanded ? "h-full" : "aspect-[21/9]"}>
        {/* Static fallback image for search engine crawlers and non-JS contexts */}
        {staticFallbackImage && (
          <noscript>
            <div className="relative h-full w-full">
              <Image
                src={staticFallbackImage}
                alt="Trek route map"
                fill
                className="object-cover"
                priority
              />
            </div>
          </noscript>
        )}
        <MapWithNoSSR
          geoJsonUrl={geoJsonUrl}
          geoJsonData={geoJsonData}
          waypoints={waypoints}
          itinerary={itinerary}
        />
      </div>

      {/* Controls overlay */}
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          onClick={() => {
            if (isExpanded && onClose) {
              onClose();
            } else {
              setIsExpanded(!isExpanded);
            }
          }}
          className="rounded-lg bg-white/90 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          aria-label={isExpanded ? "Minimize map" : "Expand map"}
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4 text-slate-700" />
          ) : (
            <Maximize2 className="h-4 w-4 text-slate-700" />
          )}
        </button>
      </div>

      {isExpanded && (
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute inset-0 z-[-1] bg-black/50"
          aria-label="Close expanded map"
        />
      )}
    </div>
  );
}
