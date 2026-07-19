export type SectionType =
  | "details"
  | "overview"
  | "itinerary"
  | "inEx"
  | "pricing"
  | "addons"
  | "faqs"
  | "gallery"
  | "map"
  | "seo"
  | "custom";

// ─── Data payload for each section type ─────────────────────────────
export interface DetailsData {
  title: string;
  slug: string;
  heroImage: string;
  difficulty: string;
  region: string;
  regionId: string;
  status: string;
  categoryId: string;
}

export interface OverviewData {
  content: string; // rich text HTML
  bestTime?: string; // e.g. "Mar-May, Sep-Nov"
  maxAltitude?: number; // Highest elevation from itinerary — auto-calculated on save
}

export interface ItineraryData {
  heading?: string;
  description?: string;
  items: {
    dayNumber: number;
    title: string;
    description: string;
    elevation: string;
    accommodation: string;
    placeDescription?: string;
    lat?: number;
    lng?: number;
  }[];
}

export interface InExData {
  heading?: string;
  description?: string;
  items: { type: "included" | "excluded"; text: string }[];
}

export interface PricingData {
  heading?: string;
  description?: string;
  items: { groupSize: string; pricePerPerson: number }[];
}

export interface FaqsData {
  heading?: string;
  description?: string;
  items: { question: string; answer: string }[];
}

export interface MapData {
  heading?: string;
  description?: string;
  centerLat: number;
  centerLng: number;
  zoom: number;
  pitch: number;
  geoJsonUrl: string;
  geoJsonData: string | null;
  waypoints: { lng: number; lat: number; label: string; description?: string }[];
}

export interface AddonData {
  heading?: string;
  description?: string;
  items: { title: string; description: string; unit: string; pricePerUnit: number }[];
}

export interface GalleryData {
  heading?: string;
  description?: string;
  items: { imageId: string; alt: string; caption: string }[];
}

export interface SeoData {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface CustomData {
  heading: string;
  content: string; // rich text HTML
  imageId?: string;
  imageAlt?: string;
}

// ─── A single section ───────────────────────────────────────────────
export interface TrekSection {
  id: string;
  type: SectionType;
  label: string;
  visible: boolean;
  data: any;
}

// ─── Create section defaults ────────────────────────────────────────
export function createDefaultSection(type: SectionType, trek?: any): TrekSection {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const base = { id, type, visible: true };

  // Restore section heading/description from saved sectionData
  let sectionMeta: Record<string, { heading?: string; description?: string }> = {};
  if (trek?.sectionData) {
    try { sectionMeta = JSON.parse(trek.sectionData); } catch {}
  }
  const meta = sectionMeta[type] || {};

  switch (type) {
    case "details":
      return {
        ...base,
        label: "Details",
        data: {
          title: trek?.title || "",
          slug: trek?.slug || "",
          heroImage: trek?.heroImage || "",
          difficulty: trek?.difficulty || "moderate",
          region: trek?.region || "",
          regionId: trek?.regionId || "",
          status: trek?.status || "draft",
          categoryId: (trek as any)?.categoryId || "",
        } as DetailsData,
      };
    case "overview":
      return {
        ...base,
        label: "Overview",
        data: {
          content: trek?.overview || "",
          bestTime: (trek as any)?.bestTime || "",
          maxAltitude: (trek as any)?.maxAltitude || 0,
        } as OverviewData,
      };
    case "itinerary": {
      // Restore lat/lng from saved waypoints matched by day number
      const savedWaypoints: { lng: number; lat: number; label: string }[] = parseJsonArray(trek?.waypoints);
      const items = (trek?.itinerary || []).map((d: any) => {
        const wp = savedWaypoints.find((w: any) => w.label === d.title || w.dayNumber === d.dayNumber);
        return {
          dayNumber: d.dayNumber,
          title: d.title || "",
          description: d.description || "",
          elevation: d.elevation || "",
          accommodation: d.accommodation || "",
          placeDescription: d.placeDescription || "",
          lat: d.lat ?? wp?.lat ?? undefined,
          lng: d.lng ?? wp?.lng ?? undefined,
        };
      });
      return {
        ...base,
        label: "Itinerary",
        data: {
          heading: meta.heading || "Itinerary",
          description: meta.description || "",
          items,
        } as ItineraryData,
      };
    }
    case "inEx": {
      const incItems = parseStringArray(trek?.inclusions).map((t: string) => ({ type: "included" as const, text: t }));
      const excItems = parseStringArray(trek?.exclusions).map((t: string) => ({ type: "excluded" as const, text: t }));
      return {
        ...base,
        label: "Inclusions & Exclusions",
        data: {
          heading: meta.heading || "Inclusions & Exclusions",
          description: meta.description || "",
          items: [...incItems, ...excItems],
        } as InExData,
      };
    }
    case "pricing":
      return {
        ...base,
        label: "Pricing Tiers",
        data: {
          heading: meta.heading || "Pricing",
          description: meta.description || "",
          items: (trek?.pricingTiers || []).map((p: any) => ({ groupSize: p.groupSize || "", pricePerPerson: p.pricePerPerson || 0 })),
        } as PricingData,
      };
    case "addons":
      return {
        ...base,
        label: "Add-ons",
        data: {
          heading: meta.heading || "Add-ons",
          description: meta.description || "",
          items: parseJsonArray(trek?.addons),
        } as AddonData,
      };
    case "gallery":
      return {
        ...base,
        label: "Gallery",
        data: {
          heading: meta.heading || "Gallery",
          description: meta.description || "",
          items: (trek?.galleryImages || []).map((g: any) => ({
            imageId: g.imageId || g.image || "",
            alt: g.alt || "",
            caption: g.caption || "",
          })),
        } as GalleryData,
      };
    case "faqs":
      return {
        ...base,
        label: "FAQs",
        data: {
          heading: meta.heading || "Frequently Asked Questions",
          description: meta.description || "",
          items: (trek?.faqs || []).map((f: any) => ({ question: f.question || "", answer: f.answer || "" })),
        } as FaqsData,
      };
    case "map":
      return {
        ...base,
        label: "Route Map (3D)",
        data: {
          heading: meta.heading || "Route Map",
          description: meta.description || "",
          centerLat: trek?.centerLat || 28.5,
          centerLng: trek?.centerLng || 83.9,
          zoom: trek?.zoom || 7,
          pitch: trek?.pitch || 45,
          geoJsonUrl: trek?.geoJsonUrl || "",
          geoJsonData: trek?.geoJsonData || null,
          waypoints: parseJsonArray(trek?.waypoints),
        } as MapData,
      };
    case "seo":
      return {
        ...base,
        label: "SEO",
        data: {
          metaTitle: trek?.metaTitle || "",
          metaDescription: trek?.metaDescription || "",
          ogImage: trek?.ogImage || "",
        } as SeoData,
      };
    case "custom":
      return {
        ...base,
        label: "Custom Section",
        data: { heading: "", content: "" } as CustomData,
      };
  }
}

function parseStringArray(val: string | undefined | null): string[] {
  if (!val) return [];
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr.filter((s: any) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function parseJsonArray(val: string | undefined | null | any[]): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
