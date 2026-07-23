import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache keys
export const cacheKeys = {
  // Treks
  treks: "treks:list",
  trek: (slug: string) => `trek:${slug}`,
  trekAvailability: (slug: string, date: string) =>
    `trek:${slug}:availability:${date}`,
  featuredTreks: "treks:featured",
  featuredSectionTreks: "treks:featured-section",
  searchTreks: "treks:search",

  // Blog
  blogPosts: "blog:list",
  blogPost: (slug: string) => `blog:${slug}`,
  blogPostMeta: (slug: string) => `blog:${slug}:meta`,

  // Layout
  categories: "layout:categories",
  siteSettings: "layout:site-settings",
  dropdownTreks: "layout:dropdown-treks",
  allRegions: "layout:regions",

  // Homepage
  homeSettings: "home:settings",
  latestReviews: "home:latest-reviews",
  stats: "home:stats",
  whyChooseUs: "home:why-choose-us",

  // Category listing
  categoryBySlug: (slug: string) => `category:${slug}`,
  categoryTreksAll: (catId: string) => `category:${catId}:treks-all`,

  // Pages
  pageContent: "site:page-content",

  // Pattern helpers for bulk invalidation
  pattern: {
    treks: "trek:*",
    blog: "blog:*",
    layout: "layout:*",
    home: "home:*",
    category: "category:*",
    site: "site:*",
  },
};

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const fresh = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(fresh));
  return fresh;
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
