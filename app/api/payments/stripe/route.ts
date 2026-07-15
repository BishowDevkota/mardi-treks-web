import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, createPaymentIntent } from "@/lib/stripe";
import { paymentRateLimit, checkRateLimit } from "@/lib/rate-limit";

// Create a Stripe payment intent
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = await checkRateLimit(paymentRateLimit, ip);
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    // Verify booking belongs to this user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "AWAITING_PAYMENT" && booking.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Booking is not eligible for payment" },
        { status: 400 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(
      booking.totalPrice,
      "usd",
      {
        bookingId: booking.id,
        userId: session.user.id,
        trekSlug: booking.trekSlug,
      }
    );

    // Upsert payment record
    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        stripePaymentIntentId: paymentIntent.id,
        amount: booking.totalPrice,
        method: "stripe",
        status: "PENDING",
      },
      create: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        method: "stripe",
        stripePaymentIntentId: paymentIntent.id,
        status: "PENDING",
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "AWAITING_PAYMENT" },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Stripe payment error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}

// Stripe webhook handler
export async function PUT(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;

      await prisma.$transaction(async (tx) => {
        // Update payment record
        await tx.payment.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: "SUCCEEDED" },
        });

        // Update booking status
        const payment = await tx.payment.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (payment) {
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CONFIRMED" },
          });
        }
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as any;

      await prisma.payment.update({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
