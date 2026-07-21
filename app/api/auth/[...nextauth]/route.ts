import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { authRateLimit, checkRateLimit } from "@/lib/rate-limit";

async function rateLimitedPOST(request: NextRequest) {
  // Apply rate limiting to POST requests (credentials login)
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = await checkRateLimit(authRateLimit, ip);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.reset),
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        },
      }
    );
  }

  return handlers.POST(request);
}

export const GET = handlers.GET;
export const POST = rateLimitedPOST;
