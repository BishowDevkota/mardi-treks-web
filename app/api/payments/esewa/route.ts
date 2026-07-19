import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentRateLimit, checkRateLimit } from "@/lib/rate-limit";

function generateHmacSha256(message: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

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

    const { bookingId, paymentType } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const type = paymentType === "ADVANCE" ? "ADVANCE" : "FULL";
    const payAmount = type === "ADVANCE" ? Math.round(booking.totalPrice * 0.2 * 100) / 100 : booking.totalPrice;

    const merchantId = process.env.ESEWA_MERCHANT_ID || "EPAYTEST";
    const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    const baseUrl = process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np";
    const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000";

    const totalAmount = payAmount.toFixed(2);
    const transactionUuid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Generate HMAC-SHA256 signature
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${merchantId}`;
    const signature = generateHmacSha256(signatureMessage, secretKey);

    // Create/update payment record with transaction UUID for later verification
    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        amount: payAmount,
        method: "esewa",
        status: "PENDING",
        esewaTransactionId: transactionUuid,
      },
      create: {
        bookingId: booking.id,
        amount: payAmount,
        method: "esewa",
        status: "PENDING",
        esewaTransactionId: transactionUuid,
      },
    });

    // eSewa requires form POST submission
    const formData = {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: merchantId,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${serverUrl}/api/payments/esewa?status=success&type=${type}&bookingId=${booking.id}`,
      failure_url: `${serverUrl}/api/payments/esewa?status=failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
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

// eSewa callback (both success and failure redirect here)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const data = searchParams.get("data"); // base64-encoded response from eSewa

  // Determine payment type and bookingId from URL params
  let paymentType = (searchParams.get("type") || "FULL") as "ADVANCE" | "FULL";
  let bookingId = searchParams.get("bookingId") || "";

  // If eSewa sends data as base64 (v2 form)
  if (data) {
    try {
      const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
      const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

      if (!bookingId) bookingId = decoded.transaction_uuid?.split("-")[0] || "";

      if (decoded.status === "COMPLETE" && bookingId) {
        const message = `transaction_code=${decoded.transaction_code},status=${decoded.status},total_amount=${decoded.total_amount},transaction_uuid=${decoded.transaction_uuid},product_code=${decoded.product_code},signed_field_names=${decoded.signed_field_names}`;
        const expectedSig = generateHmacSha256(message, secretKey);

        if (expectedSig !== decoded.signature) {
          console.error("eSewa signature mismatch");
          return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
        }

        try {
          const statusUrl = `${process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np"}/api/epay/transaction/status/?product_code=${decoded.product_code}&total_amount=${decoded.total_amount}&transaction_uuid=${decoded.transaction_uuid}`;
          const statusRes = await fetch(statusUrl);
          const statusData = await statusRes.json();

          if (statusData.status === "COMPLETE" && statusData.ref_id) {
            await updatePaymentSuccess(bookingId, statusData.ref_id, paymentType);
            return NextResponse.redirect(new URL("/dashboard?payment=success", request.url));
          }
        } catch (e) {
          await updatePaymentSuccess(bookingId, decoded.transaction_code, paymentType);
          return NextResponse.redirect(new URL("/dashboard?payment=success", request.url));
        }
      }
    } catch (error) {
      console.error("eSewa callback decode error:", error);
    }
    return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
  }

  // Legacy/fallback: handle direct refId + pid params
  const refId = searchParams.get("refId");
  const pid = searchParams.get("pid");

  if (refId && pid) {
    try {
      if (!bookingId) bookingId = pid.split("-")[0];
      await updatePaymentSuccess(bookingId, refId, paymentType);
      return NextResponse.redirect(new URL("/dashboard?payment=success", request.url));
    } catch (error) {
      console.error("eSewa legacy callback error:", error);
    }
  }

  return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
}

async function updatePaymentSuccess(bookingId: string, transactionId: string, paymentType: "ADVANCE" | "FULL") {
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { bookingId },
      data: {
        esewaTransactionId: transactionId,
        status: "SUCCEEDED",
      },
    });

    const booking = await tx.booking.findUnique({ where: { id: bookingId }, select: { paymentStatus: true } });
    const newPaymentStatus = paymentType === "ADVANCE" ? "PARTIALLY_PAID" : "FULLY_PAID";

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        paymentStatus: newPaymentStatus,
      },
    });
  });
}
