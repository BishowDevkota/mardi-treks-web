import type { MetadataRoute } from "next";

// TODO: Fetch from Payload CMS for dynamic pages
const staticRoutes = [
  { url: "https://marditreks.com", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
  { url: "https://marditreks.com/treks", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
  { url: "https://marditreks.com/blog", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
  { url: "https://marditreks.com/about", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  { url: "https://marditreks.com/contact", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
];

const trekRoutes = [
  { url: "https://marditreks.com/treks/everest-base-camp", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: "https://marditreks.com/treks/annapurna-circuit", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: "https://marditreks.com/treks/mardi-himal-trek", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: "https://marditreks.com/treks/langtang-valley", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: "https://marditreks.com/treks/ghorepani-poon-hill", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
  { url: "https://marditreks.com/treks/upper-mustang", lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
];

const blogRoutes = [
  { url: "https://marditreks.com/blog/everest-base-camp-packing-list", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  { url: "https://marditreks.com/blog/best-time-to-trek-nepal", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  { url: "https://marditreks.com/blog/nepal-trekking-permits-guide", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  { url: "https://marditreks.com/blog/altitude-sickness-prevention", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  { url: "https://marditreks.com/blog/annapurna-circuit-vs-ebc", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  { url: "https://marditreks.com/blog/sherpa-culture-and-traditions", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [...staticRoutes, ...trekRoutes, ...blogRoutes];
}
