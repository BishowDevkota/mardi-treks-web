import { auth } from "@/lib/auth";
import { verifySmtpConnection } from "@/lib/crm-email";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session || (session.user as { role?: string } | undefined)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connection = await verifySmtpConnection();
    return NextResponse.json({ success: true, connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP connection failed";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
