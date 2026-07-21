"use client";

import { useState, useEffect } from "react";

const FALLBACK_URL = "https://res.cloudinary.com/dk7ggjvlw/image/upload/mardi-treks/m0jibb3xlz3t3wonxdfq";

export function LoadingLogo() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/logo")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSrc(data.url || FALLBACK_URL);
        }
      })
      .catch(() => {
        if (!cancelled) setSrc(FALLBACK_URL);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || FALLBACK_URL}
      alt="Mardi Treks"
      className="h-20 w-auto object-contain"
    />
  );
}
