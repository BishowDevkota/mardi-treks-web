"use client";

import { useMemo, useState } from "react";
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description?: string | null;
  elevation?: string | null;
  accommodation?: string | null;
  placeDescription?: string | null;
}

interface AltitudeProfileProps {
  itinerary: ItineraryDay[];
}

function parseElevation(elevation: string | null | undefined): number | null {
  if (!elevation) return null;
  const cleaned = elevation.replace(/,/g, "").replace(/[mM]/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function formatAltitude(meters: number): string {
  return `${Math.round(meters).toLocaleString()} m`;
}

export function AltitudeProfile({ itinerary }: AltitudeProfileProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = useMemo(() => {
    const result: {
      day: number;
      label: string;
      altitude: number;
      description?: string | null;
      accommodation?: string | null;
    }[] = [];

    for (const day of itinerary) {
      const alt = parseElevation(day.elevation);
      if (alt !== null) {
        result.push({
          day: day.dayNumber,
          label: day.title,
          altitude: alt,
          description: day.description || day.placeDescription,
          accommodation: day.accommodation,
        });
      }
    }

    return result;
  }, [itinerary]);

  const maxAlt = points.length ? Math.max(...points.map((p) => p.altitude)) : 0;
  const minAlt = points.length ? Math.min(...points.map((p) => p.altitude)) : 0;
  const range = maxAlt - minAlt || 1;
  const totalGain = useMemo(() => {
    let gain = 0;
    for (let i = 1; i < points.length; i++) {
      const diff = points[i].altitude - points[i - 1].altitude;
      if (diff > 0) gain += diff;
    }
    return gain;
  }, [points]);

  // Dotted reference line every 1000m that actually falls inside this trek's range
  const gridLines = useMemo(() => {
    if (!points.length) return [];
    const lines: number[] = [];
    const first = Math.ceil(minAlt / 1000) * 1000;
    for (let v = first; v <= maxAlt; v += 1000) {
      lines.push(v);
    }
    return lines;
  }, [minAlt, maxAlt, points.length]);

  if (points.length < 1) return null;

  return (
    <div
      className="rounded-3xl border px-4 py-6 sm:px-8 sm:py-8"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-secondary)" }}>
            Altitude Profile
          </h2>
        </div>

        {/* Quick stats — derived from the same data driving the chart */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-alt)", color: "var(--color-primary)" }}
          >
            <ArrowUp className="h-3.5 w-3.5" />
            {formatAltitude(maxAlt)} max
          </span>
          <span
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {formatAltitude(minAlt)} min
          </span>
          {totalGain > 0 && (
            <span
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
            >
              +{formatAltitude(totalGain)} gain
            </span>
          )}
        </div>
      </div>

      {/* Chart area — fully fluid, no scroll containers of any kind */}
      <div className="relative mt-8">
        {/* Gridlines every 1000m */}
        <div className="absolute inset-0 pointer-events-none">
          {gridLines.map((value) => {
            const pct = ((value - minAlt) / range) * 100;
            return (
              <div
                key={value}
                className="flex items-center"
                style={{ position: "absolute", left: 0, right: 0, bottom: `${pct}%`, height: 0 }}
              >
                <span
                  className="w-14 shrink-0 text-right text-[11px] font-medium -mt-3 pr-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {formatAltitude(value)}
                </span>
                <div className="flex-1 border-t border-dashed" style={{ borderColor: "var(--color-border)" }} />
              </div>
            );
          })}
        </div>

        {/* Profile area */}
        <div className="relative ml-14" style={{ height: "220px" }}>
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%" }}
          >
            <defs>
              <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polygon
              points={
                points
                  .map((p, i) => {
                    const x = points.length > 1 ? (i / (points.length - 1)) * 100 : 50;
                    const y = (1 - (p.altitude - minAlt) / range) * 100;
                    return `${x},${y.toFixed(2)}`;
                  })
                  .join(" ") + " 100,100 0,100"
              }
              fill="url(#altGrad)"
            />
            <polyline
              points={points
                .map((p, i) => {
                  const x = points.length > 1 ? (i / (points.length - 1)) * 100 : 50;
                  const y = (1 - (p.altitude - minAlt) / range) * 100;
                  return `${x},${y.toFixed(2)}`;
                })
                .join(" ")}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Dots */}
          {points.map((point, i) => {
            const pct = points.length > 1 ? (i / (points.length - 1)) * 100 : 50;
            const altPct = ((point.altitude - minAlt) / range) * 100;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={i}
                className="absolute"
                data-dot-index={i}
                style={{
                  left: `${pct}%`,
                  bottom: `${altPct}%`,
                  transform: "translate(-50%, 50%)",
                  zIndex: isHovered ? 20 : 10,
                }}
              >
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className="flex items-center justify-center rounded-full border-2 font-bold transition-all duration-150"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderColor: "var(--color-primary)",
                      color: "var(--color-primary)",
                      height: isHovered ? "28px" : "24px",
                      width: isHovered ? "28px" : "24px",
                      fontSize: isHovered ? "11px" : "10px",
                      boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                      opacity: isHovered ? 1 : 0.85,
                    }}
                  >
                    {i + 1}
                  </div>
                </div>

                {isHovered && (
                  <TooltipContent
                    point={point}
                    index={i}
                    totalPoints={points.length}
                    altPct={altPct}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TooltipContent({
  point,
  index,
  totalPoints,
  altPct,
}: {
  point: {
    day: number;
    label: string;
    altitude: number;
    description?: string | null;
    accommodation?: string | null;
  };
  index: number;
  totalPoints: number;
  altPct: number;
}) {
  // Anchor the tooltip's own edge to the dot so it always extends *inward*,
  // never past the edge of the chart. First day: left edge pinned, grows right.
  // Last day: right edge pinned, grows left. Middle days: centered on the dot.
  let horizontalStyle: React.CSSProperties;
  if (index === 0) {
    horizontalStyle = { left: 0 };
  } else if (index === totalPoints - 1) {
    horizontalStyle = { right: 0 };
  } else {
    horizontalStyle = { left: "50%", transform: "translateX(-50%)" };
  }

  // If the dot sits high up, drop the tooltip below it instead of above.
  const showBelow = altPct > 80;

  const arrowLeftStyle: React.CSSProperties =
    index === 0
      ? { left: "16px" }
      : index === totalPoints - 1
        ? { right: "16px" }
        : { left: "50%", transform: "translateX(-50%)" };

  return (
    <div
      className="absolute z-30 w-56 pointer-events-none"
      style={{
        ...horizontalStyle,
        [showBelow ? "top" : "bottom"]: "100%",
        [showBelow ? "marginTop" : "marginBottom"]: "10px",
      }}
    >
      <div
        className="rounded-xl border px-3.5 py-3 shadow-lg"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-primary)" }}
          >
            {point.day}
          </span>
          <span className="text-sm font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
            {point.accommodation || point.label}
          </span>
        </div>
        <div className="mt-1 text-xs font-medium" style={{ color: "var(--color-primary)" }}>
          {formatAltitude(point.altitude)}
        </div>
        {point.description && (
          <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
            {point.description}
          </p>
        )}
      </div>
      <div
        className="absolute h-2 w-2 rotate-45"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          ...(showBelow
            ? { top: "-4px", borderLeftWidth: "1px", borderTopWidth: "1px", borderStyle: "solid" }
            : { bottom: "-4px", borderBottomWidth: "1px", borderRightWidth: "1px", borderStyle: "solid" }),
          ...arrowLeftStyle,
        }}
      />
    </div>
  );
}