import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// General API rate limiter: 10 requests per 10 seconds
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  prefix: "ratelimit:api",
  analytics: true,
});

// Auth rate limiter (stricter): 5 requests per 60 seconds
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:auth",
  analytics: true,
});

// Booking rate limiter: 3 requests per 60 seconds
export const bookingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  prefix: "ratelimit:booking",
  analytics: true,
});

// Payment rate limiter: 5 requests per 60 seconds
export const paymentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:payment",
  analytics: true,
});

// Contact form rate limiter: 2 requests per 300 seconds
export const contactRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "300 s"),
  prefix: "ratelimit:contact",
  analytics: true,
});

export async function checkRateLimit(
  ratelimit: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await ratelimit.limit(identifier);
  return { success, remaining, reset };
}
