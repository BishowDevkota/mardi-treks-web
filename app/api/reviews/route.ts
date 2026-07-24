import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";
import { apiRateLimit, checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
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

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in to submit a review" }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod
    const validated = reviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Invalid review data",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { trekId, rating, text } = validated.data;

    // Verify the trek exists
    const trek = await prisma.trek.findUnique({ where: { id: trekId }, select: { id: true } });
    if (!trek) {
      return NextResponse.json({ error: "Trek not found" }, { status: 404 });
    }

    // Create the review (pending admin approval)
    const review = await prisma.trekReview.create({
      data: {
        trekId,
        userId: session.user.id,
        author: session.user.name || "Anonymous",
        rating,
        text,
        approved: false,
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
