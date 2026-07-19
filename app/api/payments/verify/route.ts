import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Verify a payment after Stripe redirects back to the success page
// This handles cases where the webhook hasn't fired yet
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, paymentIntentId } = await request.json();
    if (!bookingId || !paymentIntentId) {
      return NextResponse.json({ error: "Booking ID and Payment Intent ID required" }, { status: 400 });
    }

    // Retrieve the payment intent from Stripe to verify its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({
        verified: false,
        status: paymentIntent.status,
        message: `Payment is ${paymentIntent.status}, not yet succeeded`,
      });
    }

    // Find the booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update payment and booking status (idempotent — safe if webhook already did this)
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (payment) {
      // Determine if this was an advance or full payment
      const isPartial = payment.amount < booking.totalPrice;
      const paymentStatus = isPartial ? "PARTIALLY_PAID" : "FULLY_PAID";

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCEEDED" },
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentStatus,
          },
        });
      });
    }

    return NextResponse.json({
      verified: true,
      status: "succeeded",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
