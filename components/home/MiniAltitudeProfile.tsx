"use client";

import { useMemo } from "react";

interface ItineraryDay {
  dayNumber: number;
  title: string;
  elevation?: string | null;
  description?: string | null;
  accommodation?: string | null;
}

interface Props {
  itinerary: ItineraryDay[];
}

function parseElevation(elevation: string | null | undefined): number | null {
  if (!elevation) return null;
  const cleaned = elevation.replace(/,/g, "").replace(/[mM]/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

export function MiniAltitudeProfile({ itinerary }: Props) {
  const data = useMemo(() => {
    return itinerary
      .map((day) => ({
        day: day.dayNumber,
        elevation: parseElevation(day.elevation),
        label: day.title,
      }))
      .filter((d) => d.elevation !== null) as Array<{
      day: number;
      elevation: number;
      label: string;
    }>;
  }, [itinerary]);

  if (data.length < 2) return null;

  const elevations = data.map((d) => d.elevation);
  const minEl = Math.min(...elevations);
  const maxEl = Math.max(...elevations);
  const range = maxEl - minEl || 1;

  const padding = 0.1;
  const paddedRange = range / (1 - 2 * padding);

  const width = 100;
  const height = 100;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.elevation - minEl + paddedRange * padding) / (paddedRange)) * height;
    return `${x},${y}`;
  });

  const pathD = `M${points.join(" L")}`;

  // Build area path (closed shape for gradient)
  const firstX = 0;
  const lastX = width;
  const bottomY = height;
  const areaD = `${pathD} L${lastX},${bottomY} L${firstX},${bottomY} Z`;

  // Grid lines
  const gridLines = [];
  const step = Math.pow(10, Math.floor(Math.log10(range)));
  const gridStart = Math.floor(minEl / step) * step;
  const gridEnd = Math.ceil(maxEl / step) * step;
  for (let el = gridStart; el <= gridEnd; el += step) {
    const y = height - ((el - minEl + paddedRange * padding) / (paddedRange)) * height;
    if (y >= 0 && y <= height) {
      gridLines.push({ y, label: `${Math.round(el / 1000)}k` });
    }
  }

  return (
    <div className="relative h-full w-full p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="mini-alt-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((gl, i) => (
          <line
            key={i}
            x1={0}
            y1={gl.y}
            x2={width}
            y2={gl.y}
            stroke="rgba(234,88,12,0.15)"
            strokeWidth={0.5}
          />
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#mini-alt-gradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#ea580c"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y =
            height -
            ((d.elevation - minEl + paddedRange * padding) / (paddedRange)) * height;
          return (
            <circle key={i} cx={x} cy={y} r={2.5} fill="#ea580c" stroke="#fff" strokeWidth={1} />
          );
        })}
      </svg>
    </div>
  );
}
