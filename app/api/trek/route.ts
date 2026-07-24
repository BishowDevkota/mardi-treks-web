import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRateLimit, checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limiting by IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = await checkRateLimit(apiRateLimit, ip);
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

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const trek = await prisma.trek.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        duration: true,
        difficulty: true,
        maxGroupSize: true,
        inclusions: true,
        exclusions: true,
        addons: true,
        bestTime: true,
        maxAltitude: true,
        category: { select: { slug: true, name: true } },
        pricingTiers: { select: { groupSize: true, pricePerPerson: true } },
        availableDates: {
          select: { startDate: true, seatsLeft: true },
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!trek) {
      return NextResponse.json({ error: "Trek not found" }, { status: 404 });
    }

    return NextResponse.json({ trek });
  } catch (error) {
    console.error("Trek fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
