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
  subtitle: string;
  heroBadge: string;
  heroSubtitle: string;
  heroImage: string;
  price: number;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  region: string;
  status: string;
  categoryId: string;
}

export interface OverviewData {
  content: string; // rich text HTML
}

export interface ItineraryData {
  items: {
    dayNumber: number;
    title: string;
    description: string;
    elevation: string;
    accommodation: string;
    placeDescription?: string;
  }[];
}

export interface InExData {
  items: { type: "included" | "excluded"; text: string }[];
}

export interface PricingData {
  items: { groupSize: string; pricePerPerson: number }[];
}

export interface FaqsData {
  items: { question: string; answer: string }[];
}

export interface MapData {
  centerLat: number;
  centerLng: number;
  zoom: number;
  pitch: number;
  geoJsonUrl: string;
  geoJsonData: string | null;
  waypoints: { lng: number; lat: number; label: string; description?: string }[];
}

export interface AddonData {
  items: { title: string; description: string; unit: string; pricePerUnit: number }[];
}

export interface GalleryData {
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

  switch (type) {
    case "details":
      return {
        ...base,
        label: "Details",
        data: {
          title: trek?.title || "",
          slug: trek?.slug || "",
          subtitle: trek?.subtitle || "",
          heroBadge: trek?.heroBadge || "",
          heroSubtitle: trek?.heroSubtitle || "",
          heroImage: trek?.heroImage || "",
          price: trek?.price || "",
          duration: trek?.duration || "",
          maxGroupSize: trek?.maxGroupSize || 12,
          difficulty: trek?.difficulty || "moderate",
          region: trek?.region || "annapurna",
          status: trek?.status || "draft",
          categoryId: (trek as any)?.categoryId || "",
        } as DetailsData,
      };
    case "overview":
      return {
        ...base,
        label: "Overview",
        data: { content: trek?.overview || "" } as OverviewData,
      };
    case "itinerary":
      return {
        ...base,
        label: "Itinerary",
        data: {
          items: (trek?.itinerary || []).map((d: any) => ({
            dayNumber: d.dayNumber,
            title: d.title || "",
            description: d.description || "",
            elevation: d.elevation || "",
            accommodation: d.accommodation || "",
            placeDescription: d.placeDescription || "",
          })),
        } as ItineraryData,
      };
    case "inEx": {
      const incItems = parseStringArray(trek?.inclusions).map((t: string) => ({ type: "included" as const, text: t }));
      const excItems = parseStringArray(trek?.exclusions).map((t: string) => ({ type: "excluded" as const, text: t }));
      return {
        ...base,
        label: "Inclusions & Exclusions",
        data: { items: [...incItems, ...excItems] } as InExData,
      };
    }
    case "pricing":
      return {
        ...base,
        label: "Pricing Tiers",
        data: {
          items: (trek?.pricingTiers || []).map((p: any) => ({ groupSize: p.groupSize || "", pricePerPerson: p.pricePerPerson || 0 })),
        } as PricingData,
      };
    case "addons":
      return {
        ...base,
        label: "Add-ons",
        data: {
          items: parseJsonArray(trek?.addons),
        } as AddonData,
      };
    case "gallery":
      return {
        ...base,
        label: "Gallery",
        data: {
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
          items: (trek?.faqs || []).map((f: any) => ({ question: f.question || "", answer: f.answer || "" })),
        } as FaqsData,
      };
    case "map":
      return {
        ...base,
        label: "Route Map (3D)",
        data: {
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
