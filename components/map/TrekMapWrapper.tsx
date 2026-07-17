"use client";

import dynamic from "next/dynamic";
import { Loader2, Map } from "lucide-react";

const TrekMapClient = dynamic(
  () => import("./TrekMap").then((m) => ({ default: m.TrekMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[21/9] items-center justify-center rounded-xl bg-slate-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-sm text-slate-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface Props {
  geoJsonUrl?: string;
  geoJsonData?: string | null;
  waypoints?: Array<{ lng: number; lat: number; label: string; description?: string }>;
  itinerary?: Array<{ dayNumber: number; title: string; elevation?: string | null }>;
  staticFallbackImage?: string;
}

export function TrekMapWrapper(props: Props) {
  return <TrekMapClient {...props} />;
}
