import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in to submit a review" }, { status: 401 });
    }

    const { trekId, rating, text } = await request.json();

    // Validate
    if (!trekId || !rating || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }

    if (text.trim().length < 10) {
      return NextResponse.json({ error: "Review must be at least 10 characters" }, { status: 400 });
    }

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
        rating: ratingNum,
        text: text.trim(),
        approved: false,
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
