import { revalidatePath } from "next/cache";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";

/**
 * Payload CMS hooks for cache invalidation.
 * These fire whenever content is created/updated/deleted via Payload.
 */

export function invalidateTreksCache() {
  invalidateCachePattern(cacheKeys.pattern.treks);
  invalidateCachePattern(cacheKeys.pattern.home);
  invalidateCachePattern(cacheKeys.pattern.category);
  revalidatePath("/", "layout");
}

export function invalidateBlogCache() {
  invalidateCachePattern(cacheKeys.pattern.blog);
  invalidateCachePattern(cacheKeys.pattern.home);
  revalidatePath("/blog", "layout");
}

export function invalidateCategoryCache() {
  invalidateCachePattern(cacheKeys.pattern.category);
  invalidateCachePattern(cacheKeys.pattern.layout);
  invalidateCachePattern(cacheKeys.pattern.treks);
  invalidateCachePattern(cacheKeys.pattern.home);
  revalidatePath("/", "layout");
}

export function invalidatePagesCache() {
  invalidateCachePattern(cacheKeys.pattern.site);
  invalidateCachePattern(cacheKeys.pattern.home);
  revalidatePath("/", "layout");
}

export function invalidateSettingsCache() {
  invalidateCachePattern(cacheKeys.pattern.layout);
  invalidateCachePattern(cacheKeys.pattern.site);
  invalidateCachePattern(cacheKeys.pattern.home);
  revalidatePath("/", "layout");
}

export function invalidateMediaCache() {
  // Media changes can affect any page — broad invalidation
  invalidateCachePattern(cacheKeys.pattern.treks);
  invalidateCachePattern(cacheKeys.pattern.home);
  invalidateCachePattern(cacheKeys.pattern.category);
  invalidateCachePattern(cacheKeys.pattern.blog);
  invalidateCachePattern(cacheKeys.pattern.site);
  revalidatePath("/", "layout");
}
