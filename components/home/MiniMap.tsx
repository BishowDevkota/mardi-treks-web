"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface MiniMapProps {
  geoJsonUrl?: string | null;
  geoJsonData?: string | null;
  waypoints?: Array<{ lng: number; lat: number; label: string; description?: string }>;
  centerLat?: number | null;
  centerLng?: number | null;
  zoom?: number | null;
  pitch?: number | null;
  lineColor?: string;
  lineWidth?: number;
}

export function MiniMap({
  geoJsonUrl,
  geoJsonData,
  waypoints,
  centerLat,
  centerLng,
  zoom,
  lineColor = "#ea580c",
  lineWidth = 2,
}: MiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let map: any = null;
    let cleanup = false;

    async function initMap() {
      if (!mapContainer.current || cleanup) return;

      try {
        const maplibregl = await import("maplibre-gl");
        await import("maplibre-gl/dist/maplibre-gl.css");

        const lat = centerLat ?? 28.5;
        const lng = centerLng ?? 84.0;

        map = new maplibregl.default.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              satellite: {
                type: "raster",
                tiles: [
                  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                ],
                tileSize: 256,
              },
            },
            layers: [
              { id: "satellite", type: "raster", source: "satellite", minzoom: 0, maxzoom: 22 },
            ],
          },
          center: [lng, lat],
          zoom: zoom ?? 6,
          interactive: false,
          attributionControl: false,
        });

        map.on("load", () => {
          if (cleanup) return;

          // Add GeoJSON data if present
          if (geoJsonData) {
            try {
              const parsed = JSON.parse(geoJsonData);
              map.addSource("route", {
                type: "geojson",
                data: parsed,
              });
              map.addLayer({
                id: "route-line",
                type: "line",
                source: "route",
                paint: {
                  "line-color": lineColor,
                  "line-width": lineWidth,
                  "line-opacity": 0.8,
                },
              });
              // Fit to bounds
              const bounds = new (maplibregl as any).LngLatBounds();
              if (parsed.type === "FeatureCollection") {
                parsed.features.forEach((f: any) => {
                  if (f.geometry?.type === "LineString") {
                    f.geometry.coordinates.forEach((c: number[]) => bounds.extend(c));
                  }
                });
              } else if (parsed.type === "Feature" && parsed.geometry?.type === "LineString") {
                parsed.geometry.coordinates.forEach((c: number[]) => bounds.extend(c));
              }
              if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { padding: 20 });
              }
            } catch {}
          }

          // Waypoints
          if (waypoints && waypoints.length > 0) {
            waypoints.forEach((wp) => {
              if (!wp.lng || !wp.lat) return;
              new (maplibregl as any).default.Marker({ color: lineColor, scale: 0.6 })
                .setLngLat([wp.lng, wp.lat])
                .addTo(map);
            });
          }
        });

        mapInstance.current = map;
      } catch {}
    }

    initMap();

    return () => {
      cleanup = true;
      if (map) map.remove();
    };
  }, [geoJsonData, geoJsonUrl, waypoints, centerLat, centerLng, zoom]);

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}
