import { Redis } from "@upstash/redis";

// Cache TTLs (seconds) — based on content type and update frequency
export const CACHE_TTL = {
  /** Rarely-changing layout data: categories, site settings, navigation */
  LAYOUT: 3600,           // 1 hour
  /** Moderately dynamic content: trek lists, blog posts, reviews */
  MODERATE: 1800,         // 30 minutes
  /** Frequently changing stats: booking counts, review counts */
  FREQUENT: 300,          // 5 minutes
  /** Page content from CMS (rarely changes after publish) */
  PAGE_CONTENT: 3600,     // 1 hour
  /** Default fallback */
  DEFAULT: 300,           // 5 minutes
} as const;

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
  pageBySlug: (slug: string) => `site:page:${slug}`,

  // Team
  teamMember: (slug: string) => `team:${slug}`,
  teamMembers: "team:list",

  // Pattern helpers for bulk invalidation
  pattern: {
    treks: "trek:*",
    blog: "blog:*",
    layout: "layout:*",
    home: "home:*",
    category: "category:*",
    site: "site:*",
    team: "team:*",
  },
};

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  // Upstash uses no-store HTTP requests, which cannot run while Next.js is
  // deciding whether a route can be prerendered. The database fetch remains
  // the source of truth during builds; Redis is used for real requests.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return fetcher();
  }

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
