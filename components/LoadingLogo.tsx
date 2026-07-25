"use client";

import { useState, useEffect } from "react";
import { Mountain } from "lucide-react";

export function LoadingLogo() {
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/logo")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.url) {
          setSrc(data.url);
        }
        if (!cancelled) setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (!src && !loaded) {
    return (
      <div className="flex h-20 w-20 items-center justify-center">
        <Mountain className="h-14 w-14 text-primary/40 animate-pulse" strokeWidth={1.5} />
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex h-20 w-20 items-center justify-center">
        <Mountain className="h-14 w-14 text-primary/60" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Mardi Treks"
      className="h-20 w-auto object-contain"
    />
  );
}
