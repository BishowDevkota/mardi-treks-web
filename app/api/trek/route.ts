import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
