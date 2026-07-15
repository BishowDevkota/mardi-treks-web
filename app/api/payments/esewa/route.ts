import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentRateLimit, checkRateLimit } from "@/lib/rate-limit";

// Initiate eSewa payment
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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const merchantId = process.env.ESEWA_MERCHANT_ID;
    const baseUrl = process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np";

    const transactionUuid = `${booking.id}-${Date.now()}`;
    const amount = booking.totalPrice.toFixed(2);

    // Create payment record
    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        amount: booking.totalPrice,
        method: "esewa",
        status: "PENDING",
      },
      create: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        method: "esewa",
        status: "PENDING",
      },
    });

    // eSewa requires form submission with these parameters
    const formData = {
      amt: amount,
      psc: "0",
      pdc: "0",
      txAmt: "0",
      tAmt: amount,
      pid: transactionUuid,
      scd: merchantId,
      su: `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/payments/esewa/success`,
      fu: `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/payments/esewa/failure`,
    };

    return NextResponse.json({
      paymentUrl: `${baseUrl}/api/epay/main/v2/form`,
      formData,
      transactionUuid,
    });
  } catch (error) {
    console.error("eSewa payment error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}

// eSewa success callback
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const refId = searchParams.get("refId");
  const pid = searchParams.get("pid");

  if (!refId || !pid) {
    return NextResponse.redirect(
      new URL("/dashboard?payment=error", request.url)
    );
  }

  try {
    // Extract booking ID from pid (format: bookingId-timestamp)
    const bookingId = pid.split("-")[0];

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { bookingId },
        data: {
          esewaTransactionId: refId,
          status: "SUCCEEDED",
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      });
    });

    return NextResponse.redirect(
      new URL("/dashboard?payment=success", request.url)
    );
  } catch (error) {
    console.error("eSewa callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?payment=error", request.url)
    );
  }
}
