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
  try {
    const cached = await redis.get<T>(key);
    if (cached) return cached;
  } catch (error) {
    console.warn(`Cache read failed for key "${key}", fetching fresh data:`, error);
  }

  const fresh = await fetcher();
  try {
    await redis.setex(key, ttl, JSON.stringify(fresh));
  } catch (error) {
    console.warn(`Cache write failed for key "${key}":`, error);
  }
  return fresh;
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    // Use SCAN instead of KEYS to avoid blocking Redis on large datasets
    const keys: string[] = [];
    let cursor: number | string = 0;
    do {
      const scanResult = await redis.scan(cursor, { match: pattern, count: 100 }) as [string, string[]];
      cursor = scanResult[0];
      keys.push(...scanResult[1]);
    } while (Number(cursor) !== 0);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Failed to invalidate cache pattern "${pattern}":`, error);
  }
}
