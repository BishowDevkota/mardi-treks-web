"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

interface MapPreviewProps {
  centerLat: number;
  centerLng: number;
  zoom: number;
  pitch: number;
}

export function MapPreview({ centerLat, centerLng, zoom, pitch }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: any = null;
    let mounted = true;

    async function init() {
      if (!containerRef.current) return;

      try {
        const mapboxgl = await import("mapbox-gl");
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          setError("Mapbox token not configured");
          setLoading(false);
          return;
        }

        mapboxgl.default.accessToken = token;

        map = new mapboxgl.default.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [centerLng, centerLat],
          zoom,
          pitch,
          interactive: false,
        } as any);

        map.on("load", () => {
          if (!mounted) return;
          try {
            map.addSource("mapbox-dem", {
              type: "raster-dem",
              url: "mapbox://mapbox.mapbox-terrain-dem-v1",
              tileSize: 512,
              maxzoom: 14,
            } as any);
            map.setTerrain({ source: "mapbox-dem", exaggeration: 2.0 });
          } catch {}
          setLoading(false);
        });

        map.on("error", () => {
          if (mounted) setLoading(false);
        });
      } catch {
        if (mounted) setError("Failed to load map");
        setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
      if (map) map.remove();
    };
  }, [centerLat, centerLng, zoom, pitch]);

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-100">
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200">
      <div ref={containerRef} className="h-48 w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur">
        3D Terrain · {zoom}x zoom
      </div>
      <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur">
        {centerLat.toFixed(2)}°N, {centerLng.toFixed(2)}°E
      </div>
    </div>
  );
}
