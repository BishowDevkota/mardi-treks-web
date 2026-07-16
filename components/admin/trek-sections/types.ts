// ─── All possible section types ─────────────────────────────────────
export type SectionType =
  | "details"
  | "overview"
  | "highlights"
  | "itinerary"
  | "inclusions"
  | "exclusions"
  | "pricing"
  | "dates"
  | "faqs"
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
}

export interface OverviewData {
  content: string; // rich text HTML
}

export interface HighlightsData {
  items: { icon: string; text: string }[];
}

export interface ItineraryData {
  items: {
    dayNumber: number;
    title: string;
    description: string;
    elevation: string;
    accommodation: string;
  }[];
}

export interface InExData {
  items: string[];
}

export interface PricingData {
  items: { groupSize: string; pricePerPerson: number }[];
}

export interface DatesData {
  items: { startDate: string; seatsLeft: number }[];
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

export interface SeoData {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface CustomData {
  heading: string;
  content: string; // rich text HTML
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
        } as DetailsData,
      };
    case "overview":
      return {
        ...base,
        label: "Overview",
        data: { content: trek?.overview || "" } as OverviewData,
      };
    case "highlights":
      return {
        ...base,
        label: "Highlights",
        data: {
          items: (trek?.highlights || []).map((h: any) => ({ icon: h.icon || "", text: h.text || "" })),
        } as HighlightsData,
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
          })),
        } as ItineraryData,
      };
    case "inclusions":
      return {
        ...base,
        label: "Inclusions",
        data: { items: parseStringArray(trek?.inclusions) } as InExData,
      };
    case "exclusions":
      return {
        ...base,
        label: "Exclusions",
        data: { items: parseStringArray(trek?.exclusions) } as InExData,
      };
    case "pricing":
      return {
        ...base,
        label: "Pricing Tiers",
        data: {
          items: (trek?.pricingTiers || []).map((p: any) => ({ groupSize: p.groupSize || "", pricePerPerson: p.pricePerPerson || 0 })),
        } as PricingData,
      };
    case "dates":
      return {
        ...base,
        label: "Available Dates",
        data: {
          items: (trek?.availableDates || []).map((d: any) => ({
            startDate: d.startDate instanceof Date ? d.startDate.toISOString().split("T")[0] : d.startDate || "",
            seatsLeft: d.seatsLeft || 12,
          })),
        } as DatesData,
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
