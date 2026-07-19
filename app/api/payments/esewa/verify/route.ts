import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateHmacSha256(message: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "SUCCEEDED") {
      return NextResponse.json({ status: "already_confirmed" });
    }

    // If we have a transaction UUID stored, check with eSewa
    const transactionUuid = payment.esewaTransactionId;
    if (transactionUuid && payment.amount > 0) {
      const merchantId = process.env.ESEWA_MERCHANT_ID || "EPAYTEST";
      const baseUrl = process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np";
      const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

      try {
        const statusUrl = `${baseUrl}/api/epay/transaction/status/?product_code=${merchantId}&total_amount=${payment.amount.toFixed(2)}&transaction_uuid=${transactionUuid}`;
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();

        if (statusData.status === "COMPLETE" && statusData.ref_id) {
          // Verify signature if present
          if (statusData.signed_field_names && statusData.signature) {
            const message = statusData.signed_field_names
              .split(",")
              .map((f: string) => `${f}=${statusData[f]}`)
              .join(",");
            const expectedSig = generateHmacSha256(message, secretKey);
            if (expectedSig !== statusData.signature) {
              return NextResponse.json({ status: "signature_mismatch" });
            }
          }

          // Update payment and booking
          const paymentType = payment.amount < payment.booking.totalPrice ? "ADVANCE" : "FULL";
          const newPaymentStatus = paymentType === "ADVANCE" ? "PARTIALLY_PAID" : "FULLY_PAID";

          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { bookingId },
              data: {
                esewaTransactionId: statusData.ref_id,
                status: "SUCCEEDED",
              },
            });
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                status: "CONFIRMED",
                paymentStatus: newPaymentStatus,
              },
            });
          });

          return NextResponse.json({ status: "confirmed", paymentStatus: newPaymentStatus });
        }

        return NextResponse.json({ status: statusData.status || "unknown" });
      } catch (err) {
        console.error("eSewa status check error:", err);
        return NextResponse.json({ status: "check_failed" });
      }
    }

    return NextResponse.json({ status: "no_transaction" });
  } catch (error) {
    console.error("eSewa verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
