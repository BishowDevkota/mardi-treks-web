"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapContentProps {
  geoJsonUrl?: string;
  waypoints?: Array<{ lng: number; lat: number; label: string }>;
  itinerary?: Array<{ dayNumber: number; title: string; elevation?: string }>;
}

export default function MapContent({
  geoJsonUrl,
  waypoints,
  itinerary,
}: MapContentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError("Mapbox token not configured");
      return;
    }

    mapboxgl.accessToken = token;

    try {
      // Default to a central Nepal viewpoint
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [83.9, 28.5], // Central Nepal
        zoom: 7,
        pitch: 45,
        bearing: 0,
        terrain: {
          source: "mapbox-dem",
          exaggeration: 1.5,
        },
      });

      newMap.on("load", () => {
        // Add DEM source for 3D terrain
        newMap.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });

        // Set terrain
        newMap.setTerrain({
          source: "mapbox-dem",
          exaggeration: 1.5,
        });

        // Add sky layer for atmosphere
        newMap.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 15,
          },
        });

        // If we have a GeoJSON URL, fetch and add it
        if (geoJsonUrl) {
          fetch(geoJsonUrl)
            .then((res) => res.json())
            .then((data) => {
              newMap.addSource("route", {
                type: "geojson",
                data,
              });

              newMap.addLayer({
                id: "route-line",
                type: "line",
                source: "route",
                layout: {
                  "line-join": "round",
                  "line-cap": "round",
                },
                paint: {
                  "line-color": "#0f766e",
                  "line-width": 4,
                  "line-opacity": 0.8,
                },
              });

              // Fit map to route bounds
              const bounds = new mapboxgl.LngLatBounds();
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
            });
        }

        // Add waypoint markers from itinerary data
        if (waypoints) {
          waypoints.forEach((wp, i) => {
            const el = document.createElement("div");
            el.className =
              "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-md border-2 border-white";
            el.textContent = `${i + 1}`;

            new mapboxgl.Marker({ element: el })
              .setLngLat([wp.lng, wp.lat])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 }).setHTML(
                  `<strong>${wp.label}</strong>`
                )
              )
              .addTo(newMap);
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
