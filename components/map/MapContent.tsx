"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapContentProps {
  geoJsonUrl?: string;
  geoJsonData?: string | null;
  waypoints?: Array<{ lng: number; lat: number; label: string; description?: string }>;
  itinerary?: Array<{ dayNumber: number; title: string; elevation?: string | null }>;
}

export default function MapContent({
  geoJsonUrl,
  geoJsonData,
  waypoints,
  itinerary,
}: MapContentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError("Mapbox token not configured");
      return;
    }

    // Helper to draw a GeoJSON route on the map
    function drawGeoJsonRoute(m: maplibregl.Map, data: any) {
      if (m.getSource("route")) return; // already drawn

      m.addSource("route", { type: "geojson", data });

      m.addLayer({
        id: "route-glow", type: "line", source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ea580c", "line-width": 8, "line-opacity": 0.2 },
      });
      m.addLayer({
        id: "route-line", type: "line", source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#c2410c", "line-width": 4, "line-opacity": 0.9 },
      });
      m.addLayer({
        id: "route-label", type: "symbol", source: "route",
        layout: {
          "symbol-placement": "line-center",
          "text-field": "Actual Trek Route",
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-size": 11, "text-offset": [0, -1.8],
        },
        paint: { "text-color": "#c2410c", "text-halo-color": "#ffffff", "text-halo-width": 2 },
      });

      const bounds = new maplibregl.LngLatBounds();
      if (data.type === "FeatureCollection") {
        data.features?.forEach((f: any) => {
          if (f.geometry?.type === "LineString") {
            f.geometry.coordinates.forEach((c: number[]) => bounds.extend(c as [number, number]));
          }
        });
      } else if (data.type === "Feature" && data.geometry?.type === "LineString") {
        data.geometry.coordinates.forEach((c: number[]) => bounds.extend(c as [number, number]));
      }
      if (!bounds.isEmpty()) m.fitBounds(bounds, { padding: 60 });
    }

    // Helper to draw a dashed straight-line route between waypoints
    function drawWaypointRoute(m: maplibregl.Map, wps: Array<{ lng: number; lat: number }>) {
      const coords = wps.map((wp) => [wp.lng, wp.lat]);
      const geojson: any = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: {},
      };

      if (m.getSource("wp-route")) return; // already drawn

      m.addSource("wp-route", { type: "geojson", data: geojson });
      m.addLayer({
        id: "wp-route-line", type: "line", source: "wp-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#c2410c", "line-width": 3, "line-opacity": 0.6, "line-dasharray": [3, 2] },
      });
      m.addLayer({
        id: "wp-route-label", type: "symbol", source: "wp-route",
        layout: {
          "symbol-placement": "line-center",
          "text-field": "Estimated route (straight-line)",
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-size": 10, "text-offset": [0, -1.5],
        },
        paint: { "text-color": "#c2410c", "text-halo-color": "#ffffff", "text-halo-width": 2 },
      });

      const bounds = new maplibregl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c as [number, number]));
      if (!bounds.isEmpty()) m.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }

    try {
      // Clean satellite view — like Google Maps, no 3D terrain distortion
      const style: any = {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution:
              "&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
          },
        },
        layers: [
          { id: "satellite", type: "raster", source: "satellite" },
        ],
      };

      const newMap = new maplibregl.Map({
        container: mapContainer.current,
        style,
        center: [83.9, 28.5], // Central Nepal
        zoom: 8,
        pitch: 0,
        bearing: 0,
      });

      newMap.on("load", () => {
        // Flat 2D satellite view — no terrain distortion

        // If we have inline GeoJSON data (stored in DB), use it directly
        if (geoJsonData) {
          try {
            const data = JSON.parse(geoJsonData);
            if (data && data.type) {
              drawGeoJsonRoute(newMap, data);
            }
          } catch {}
        }
        // Otherwise fetch from URL via proxy
        if (!geoJsonData && geoJsonUrl) {
          fetch(`/api/geojson-proxy?url=${encodeURIComponent(geoJsonUrl)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.error) {
                console.warn("GeoJSON proxy:", data.error, "— falling back to waypoints");
                if (waypoints && waypoints.length >= 2) drawWaypointRoute(newMap, waypoints);
                return null;
              }
              return data;
            })
            .then((data) => {
              if (!data) return;
              newMap.addSource("route", {
                type: "geojson",
                data,
              });

              // Glow layer under route
              newMap.addLayer({
                id: "route-glow",
                type: "line",
                source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                  "line-color": "#ea580c",
                  "line-width": 8,
                  "line-opacity": 0.2,
                },
              });

              // Main route line
              newMap.addLayer({
                id: "route-line",
                type: "line",
                source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                  "line-color": "#c2410c",
                  "line-width": 4,
                  "line-opacity": 0.9,
                },
              });

              // Route label
              newMap.addLayer({
                id: "route-label",
                type: "symbol",
                source: "route",
                layout: {
                  "symbol-placement": "line-center",
                  "text-field": "Actual Trek Route",
                  "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                  "text-size": 11,
                  "text-offset": [0, -1.8],
                },
                paint: {
                  "text-color": "#c2410c",
                  "text-halo-color": "#ffffff",
                  "text-halo-width": 2,
                },
              });

              // Fit map to route bounds
              const bounds = new maplibregl.LngLatBounds();
              data.features?.forEach((feature: any) => {
                if (feature.geometry?.type === "LineString") {
                  feature.geometry.coordinates.forEach((coord: number[]) => {
                    bounds.extend(coord as [number, number]);
                  });
                }
              });
              if (!bounds.isEmpty()) {
                newMap.fitBounds(bounds, { padding: 60 });
              }
            })
            .catch((err) => {
              console.error("Failed to load GeoJSON:", err);
              // Fall back to straight-line waypoint route
              if (waypoints && waypoints.length >= 2) {
                drawWaypointRoute(newMap, waypoints);
              }
            });
        }

        // Draw straight-line waypoint route as fallback when no GeoJSON is available
        if (waypoints && waypoints.length >= 2 && !newMap.getSource("route") && !newMap.getSource("wp-route")) {
          drawWaypointRoute(newMap, waypoints);
        }

        // Add waypoint markers
        if (waypoints) {
          waypoints.forEach((wp, i) => {
            const el = document.createElement("div");
            el.className =
              "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg border-2 border-white cursor-pointer transition-transform hover:scale-110";
            el.textContent = `${i + 1}`;

            // Build popup HTML with label + description
            const popupHtml = [
              `<div class="text-left max-w-[200px]">`,
              wp.label ? `<strong class="text-sm block">${wp.label}</strong>` : "",
              wp.description ? `<p class="text-xs text-slate-500 mt-1">${wp.description}</p>` : "",
              `<span class="text-[10px] text-slate-400 mt-1 block">${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}</span>`,
              `</div>`,
            ].join("");

            const popup = new maplibregl.Popup({ offset: 25, closeButton: false, maxWidth: "280px" }).setHTML(popupHtml);

            new maplibregl.Marker({ element: el })
              .setLngLat([wp.lng, wp.lat])
              .addTo(newMap);

            // Show popup on hover, hide on leave
            el.addEventListener("mouseenter", () => popup.setLngLat([wp.lng, wp.lat]).addTo(newMap));
            el.addEventListener("mouseleave", () => popup.remove());
          });
        }

        // Add itinerary day markers if waypoints not provided
        if (!waypoints && itinerary) {
          // Placeholder: itinerary day markers would need lat/lng from CMS
        }

        setIsLoaded(true);
      });

      newMap.on("error", (e) => {
        console.error("Map error:", e);
      });

      map.current = newMap;
    } catch (err) {
      setError("Failed to initialize map");
      console.error("Map init error:", err);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [geoJsonUrl, waypoints, itinerary]);

  if (error) {
    return (
      <div className="flex aspect-[21/9] items-center justify-center bg-surface">
        <p className="text-sm text-error">{error}</p>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}
