"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Maximize2, Minimize2 } from "lucide-react";

interface MapContentProps {
  geoJsonUrl?: string;
  geoJsonData?: string | null;
  waypoints?: Array<{ lng: number; lat: number; label: string; description?: string }>;
  itinerary?: Array<{ dayNumber: number; title: string; elevation?: string | null }>;
}

const subscribeToClient = () => () => {};

export default function MapContent({
  geoJsonUrl,
  geoJsonData,
  waypoints,
  itinerary,
}: MapContentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [error, setError] = useState<string | null>(token ? null : "Mapbox token not configured");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!token) return;

    function withPitchAndBearing(m: maplibregl.Map) {
      return { pitch: m.getPitch(), bearing: m.getBearing() };
    }

    function drawGeoJsonRoute(m: maplibregl.Map, data: any) {
      if (m.getSource("route")) return;

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
      if (!bounds.isEmpty()) m.fitBounds(bounds, { padding: 60, ...withPitchAndBearing(m) });
    }

    function drawWaypointRoute(m: maplibregl.Map, wps: Array<{ lng: number; lat: number }>) {
      const coords = wps.map((wp) => [wp.lng, wp.lat]);
      const geojson: any = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: {},
      };

      if (m.getSource("wp-route")) return;

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
      if (!bounds.isEmpty()) m.fitBounds(bounds, { padding: 60, maxZoom: 14, ...withPitchAndBearing(m) });
    }

    try {
      const style: any = {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.jpg90?access_token=${token}`,
            ],
            tileSize: 512,
            attribution: "&copy; Mapbox &copy; OpenStreetMap contributors &copy; Maxar",
          },
          "terrain-source": {
            type: "raster-dem",
            tiles: [
              `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=${token}`,
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

      const newMap = new maplibregl.Map({
        container: mapContainer.current,
        style,
        center: [83.9, 28.5],
        zoom: 8,
        pitch: 48,
        bearing: 0,
        attributionControl: { compact: true },
      });

      // Add production controls
      newMap.addControl(new maplibregl.NavigationControl(), "bottom-right");
      newMap.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 120 }), "bottom-left");

      // Single terrain setup — called once after all data is ready
      function setupAndFitMap() {
        try {
          newMap.setTerrain({ source: "terrain-source", exaggeration: 1.2 });
        } catch (e) {
          console.warn("Failed to set terrain:", e);
        }

        const hasRoute = newMap.getSource("route") || newMap.getSource("wp-route");
        if (!hasRoute) {
          if (geoJsonData) {
            try {
              const data = JSON.parse(geoJsonData);
              if (data && data.type) drawGeoJsonRoute(newMap, data);
            } catch {}
          } else if (geoJsonUrl) {
            fetch(`/api/geojson-proxy?url=${encodeURIComponent(geoJsonUrl)}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.error) {
                  if (waypoints && waypoints.length >= 2) drawWaypointRoute(newMap, waypoints);
                  return;
                }
                if (!data) return;
                newMap.addSource("route", { type: "geojson", data });
                newMap.addLayer({
                  id: "route-glow", type: "line", source: "route",
                  layout: { "line-join": "round", "line-cap": "round" },
                  paint: { "line-color": "#ea580c", "line-width": 8, "line-opacity": 0.2 },
                });
                newMap.addLayer({
                  id: "route-line", type: "line", source: "route",
                  layout: { "line-join": "round", "line-cap": "round" },
                  paint: { "line-color": "#c2410c", "line-width": 4, "line-opacity": 0.9 },
                });
                newMap.addLayer({
                  id: "route-label", type: "symbol", source: "route",
                  layout: {
                    "symbol-placement": "line-center",
                    "text-field": "Actual Trek Route",
                    "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                    "text-size": 11, "text-offset": [0, -1.8],
                  },
                  paint: { "text-color": "#c2410c", "text-halo-color": "#ffffff", "text-halo-width": 2 },
                });
                const b = new maplibregl.LngLatBounds();
                data.features?.forEach((f: any) => {
                  if (f.geometry?.type === "LineString") {
                    f.geometry.coordinates.forEach((c: number[]) => b.extend(c as [number, number]));
                  }
                });
                if (!b.isEmpty()) newMap.fitBounds(b, { padding: 60, maxZoom: 13, pitch: newMap.getPitch(), bearing: newMap.getBearing() });
              })
              .catch((err) => {
                console.error("Failed to load GeoJSON:", err);
                if (waypoints && waypoints.length >= 2) drawWaypointRoute(newMap, waypoints);
              });
          } else if (waypoints && waypoints.length >= 2) {
            drawWaypointRoute(newMap, waypoints);
          }
        }

        // Waypoint markers
        if (waypoints) {
          waypoints.forEach((wp, i) => {
            const el = document.createElement("div");
            el.className =
              "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg border-2 border-white cursor-pointer";
            el.textContent = `${i + 1}`;
            new maplibregl.Marker({ element: el }).setLngLat([wp.lng, wp.lat]).addTo(newMap);
            let popup: maplibregl.Popup | null = null;
            el.addEventListener("mouseenter", () => {
              popup?.remove();
              popup = new maplibregl.Popup({ offset: 25, closeButton: false, maxWidth: "280px" })
                .setLngLat([wp.lng, wp.lat])
                .setHTML([
                  `<div class="text-left max-w-[200px]">`,
                  wp.label ? `<strong class="text-sm block">${wp.label}</strong>` : "",
                  wp.description ? `<p class="text-xs text-slate-500 mt-1">${wp.description}</p>` : "",
                  `<span class="text-[10px] text-slate-400 mt-1 block">${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}</span>`,
                  `</div>`,
                ].join(""))
                .addTo(newMap);
            });
            el.addEventListener("mouseleave", () => { popup?.remove(); popup = null; });
          });
        }

        setIsLoaded(true);
      }

      // Wait for style + all sources to be ready before setting terrain
      if (newMap.isStyleLoaded()) {
        setupAndFitMap();
      } else {
        newMap.once("style.load", setupAndFitMap);
      }

      newMap.on("error", (e) => {
        console.error("Map error:", (e as any).error ?? e);
      });

      map.current = newMap;
    } catch (err) {
      queueMicrotask(() => setError("Failed to initialize map"));
      console.error("Map init error:", err);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [geoJsonUrl, waypoints, itinerary]);

  useEffect(() => {
    const id = requestAnimationFrame(() => map.current?.resize());
    return () => cancelAnimationFrame(id);
  }, [isFullscreen]);

  // Lock scrolling everywhere fullscreen is open, close on Escape, and
  // force the background to black. We lock BOTH <body> and <html> because
  // on many setups (Next.js layouts, Tailwind resets, wrapper divs with
  // their own overflow) the actual scrolling element is <html>, not
  // <body> — locking only body leaves its scrollbar gutter visible as a
  // thin strip on the side. setProperty(..., "important") ensures this
  // can't be silently overridden by a global stylesheet rule with higher
  // specificity.
  useEffect(() => {
    if (!isFullscreen) return;

    const html = document.documentElement;
    const body = document.body;

    const prev = {
      htmlOverflow: html.style.overflow,
      htmlBg: html.style.backgroundColor,
      bodyOverflow: body.style.overflow,
      bodyBg: body.style.backgroundColor,
    };

    html.style.setProperty("overflow", "hidden", "important");
    body.style.setProperty("overflow", "hidden", "important");
    html.style.setProperty("background-color", "#000000", "important");
    body.style.setProperty("background-color", "#000000", "important");

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.backgroundColor = prev.htmlBg;
      body.style.overflow = prev.bodyOverflow;
      body.style.backgroundColor = prev.bodyBg;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const fullscreenToggle = (
    <button
      onClick={() => setIsFullscreen((prev) => !prev)}
      aria-label={isFullscreen ? "Exit full screen" : "View full screen"}
      title={isFullscreen ? "Exit full screen" : "View full screen"}
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-surface/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-surface"
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  );

  if (error) {
    return (
      <div className="flex aspect-[21/9] items-center justify-center bg-surface">
        <p className="text-sm text-error">{error}</p>
      </div>
    );
  }

  const mapBody = <div ref={mapContainer} className="h-full w-full bg-black" />;

  if (isFullscreen && mounted) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] bg-black"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          height: "100dvh",
          width: "100dvw",
          margin: 0,
          padding: 0,
          backgroundColor: "#000000",
        }}
      >
        {fullscreenToggle}
        {mapBody}
      </div>,
      document.body
    );
  }

  return (
    <div className="relative h-full w-full">
      {fullscreenToggle}
      {mapBody}
    </div>
  );
}
