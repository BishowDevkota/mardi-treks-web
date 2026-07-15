"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, Map, Maximize2, Minimize2 } from "lucide-react";

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
  waypoints?: Array<{ lng: number; lat: number; label: string }>;
  itinerary?: Array<{ dayNumber: number; title: string; elevation?: string }>;
  staticFallbackImage?: string;
}

export function TrekMap({
  geoJsonUrl,
  waypoints,
  itinerary,
  staticFallbackImage,
}: TrekMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  if (!showMap) {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        {/* Static fallback for SEO / crawlers */}
        {staticFallbackImage ? (
          <img
            src={staticFallbackImage}
            alt="Trek route map"
            className="aspect-[21/9] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[21/9] items-center justify-center bg-gradient-to-br from-primary/5 to-primary-light/5">
            <div className="text-center">
              <Map className="mx-auto h-12 w-12 text-primary/40" />
              <p className="mt-2 text-sm text-text-muted">Route Map</p>
            </div>
          </div>
        )}
        <div className="border-t border-border bg-surface p-3 text-center">
          <button
            onClick={() => setShowMap(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            <Map className="h-4 w-4" />
            View Interactive 3D Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border transition-all ${
        isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "relative"
      }`}
    >
      <div className={isExpanded ? "h-full" : "aspect-[21/9]"}>
        <MapWithNoSSR
          geoJsonUrl={geoJsonUrl}
          waypoints={waypoints}
          itinerary={itinerary}
        />
      </div>

      {/* Controls overlay */}
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
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
