"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

interface MapPreviewProps {
  centerLat: number;
  centerLng: number;
  zoom: number;
  pitch: number;
  geoJsonData?: string | null;
}

export function MapPreview({ centerLat, centerLng, zoom, pitch, geoJsonData }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: any = null;
    let mounted = true;

    async function init() {
      if (!containerRef.current) return;

      try {
        const maplibregl = await import("maplibre-gl");

        const style: any = {
          version: 8,
          sources: {
            satellite: {
              type: "raster",
              tiles: [
                `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.jpg90?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
              ],
              tileSize: 512,
              attribution: "&copy; Mapbox &copy; OpenStreetMap contributors &copy; Maxar",
            },
            "terrain-source": {
              type: "raster-dem",
              tiles: [
                `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
              ],
              tileSize: 512,
              maxzoom: 14,
              encoding: "mapbox",
              attribution: "&copy; Mapbox &copy; OpenStreetMap contributors",
            },
          },
          layers: [
            { id: "satellite", type: "raster", source: "satellite" },
          ],
          sky: {
            "sky-color": "#8ecae6",
            "horizon-color": "#f0ebe3",
            "fog-color": "#e0e6ed",
            "fog-ground-blend": 0.6,
          },
        };

        map = new maplibregl.default.Map({
          container: containerRef.current,
          style,
          center: [centerLng, centerLat],
          zoom,
          pitch: 42,
          interactive: false,
        });

        map.on("load", () => {
          try {
            map.setTerrain({ source: "terrain-source", exaggeration: 1.3 });

            // Re-fit bounds with terrain enabled so pitch is preserved
            if (geoJsonData) {
              try {
                const route = JSON.parse(geoJsonData);
                const bounds = new maplibregl.LngLatBounds();
                const includeCoordinates = (coordinates: unknown) => {
                  if (!Array.isArray(coordinates)) return;
                  if (
                    coordinates.length >= 2 &&
                    typeof coordinates[0] === "number" &&
                    typeof coordinates[1] === "number"
                  ) {
                    bounds.extend([coordinates[0], coordinates[1]]);
                    return;
                  }
                  coordinates.forEach(includeCoordinates);
                };
                if (route.type === "FeatureCollection") {
                  route.features?.forEach((feature: any) => includeCoordinates(feature.geometry?.coordinates));
                } else if (route.type === "Feature") {
                  includeCoordinates(route.geometry?.coordinates);
                } else {
                  includeCoordinates(route.coordinates);
                }
                if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 30, maxZoom: 13, pitch: map.getPitch(), bearing: map.getBearing() });
              } catch {}
            }
          } catch {}
        });

        map.on("load", () => {
          if (geoJsonData) {
            try {
              const route = JSON.parse(geoJsonData);
              map.addSource("uploaded-route", { type: "geojson", data: route });
              map.addLayer({
                id: "uploaded-route-glow",
                type: "line",
                source: "uploaded-route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#f97316", "line-width": 8, "line-opacity": 0.3 },
              });
              map.addLayer({
                id: "uploaded-route-line",
                type: "line",
                source: "uploaded-route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#c2410c", "line-width": 4, "line-opacity": 1 },
              });

              const bounds = new maplibregl.LngLatBounds();
              const includeCoordinates = (coordinates: unknown) => {
                if (!Array.isArray(coordinates)) return;
                if (
                  coordinates.length >= 2 &&
                  typeof coordinates[0] === "number" &&
                  typeof coordinates[1] === "number"
                ) {
                  bounds.extend([coordinates[0], coordinates[1]]);
                  return;
                }
                coordinates.forEach(includeCoordinates);
              };
              if (route.type === "FeatureCollection") {
                route.features?.forEach((feature: any) => includeCoordinates(feature.geometry?.coordinates));
              } else if (route.type === "Feature") {
                includeCoordinates(route.geometry?.coordinates);
              } else {
                includeCoordinates(route.coordinates);
              }
              if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 30, maxZoom: 13 });
            } catch {
              if (mounted) setError("Uploaded route data is invalid");
            }
          }
          if (mounted) setLoading(false);
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
  }, [centerLat, centerLng, zoom, pitch, geoJsonData]);

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
