"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface GalleryContextValue {
  isLightboxOpen: boolean;
  setLightboxOpen: (open: boolean) => void;
}

const GalleryContext = createContext<GalleryContextValue>({
  isLightboxOpen: false,
  setLightboxOpen: () => {},
});

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  return (
    <GalleryContext.Provider value={{ isLightboxOpen, setLightboxOpen }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGalleryLightbox() {
  return useContext(GalleryContext);
}
