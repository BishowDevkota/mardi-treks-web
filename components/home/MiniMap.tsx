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

        const miniStyle: any = {
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
            { id: "satellite", type: "raster", source: "satellite", minzoom: 0, maxzoom: 22 },
          ],
          sky: {
            "sky-color": "#8ecae6",
            "horizon-color": "#f0ebe3",
            "fog-color": "#e0e6ed",
            "fog-ground-blend": 0.6,
          },
        };

        map = new maplibregl.default.Map({
          container: mapContainer.current,
          style: miniStyle,
          center: [lng, lat],
          zoom: zoom ?? 6,
          pitch: 35,
          interactive: false,
          attributionControl: false,
        });

        map.on("load", () => {
          try {
            map.setTerrain({ source: "terrain-source", exaggeration: 1.3 });
          } catch {}
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
