import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentRateLimit, checkRateLimit } from "@/lib/rate-limit";

// Initiate Khalti payment
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

    const { bookingId, returnUrl } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const secretKey = process.env.KHALTI_SECRET_KEY;
    const baseUrl = process.env.KHALTI_BASE_URL || "https://rc-api.khalti.com";

    // Create Khalti payment initiation
    const response = await fetch(`${baseUrl}/api/v2/epayment/initiate/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        return_url: returnUrl || `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/dashboard`,
        website_url: process.env.PAYLOAD_PUBLIC_SERVER_URL,
        amount: Math.round(booking.totalPrice * 100), // Khalti uses paisa
        purchase_order_id: booking.id,
        purchase_order_name: booking.trekTitle,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Khalti payment initiation failed");
    }

    // Create payment record
    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        amount: booking.totalPrice,
        method: "khalti",
        status: "PENDING",
      },
      create: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        method: "khalti",
        status: "PENDING",
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "AWAITING_PAYMENT" },
    });

    return NextResponse.json({
      paymentUrl: data.payment_url,
      pidx: data.pidx,
    });
  } catch (error) {
    console.error("Khalti payment error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}

// Khalti webhook / verification
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { pidx, status, transaction_id, purchase_order_id } = body;

    if (status === "Completed") {
      // Verify with Khalti
      const secretKey = process.env.KHALTI_SECRET_KEY;
      const baseUrl = process.env.KHALTI_BASE_URL || "https://rc-api.khalti.com";

      const verifyResponse = await fetch(
        `${baseUrl}/api/v2/epayment/lookup/`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pidx }),
        }
      );

      const verification = await verifyResponse.json();

      if (verification.status === "Completed") {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { bookingId: purchase_order_id },
            data: {
              khaltiTransactionId: transaction_id,
              status: "SUCCEEDED",
            },
          });

          await tx.booking.update({
            where: { id: purchase_order_id },
            data: { status: "CONFIRMED" },
          });
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Khalti webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
