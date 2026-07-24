import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchAndLogInboxEmails } from "@/lib/crm-email-fetcher";
import { revalidatePath } from "next/cache";

/**
 * POST /api/crm/fetch-emails
 * Triggers a fetch of recent emails from the configured IMAP inbox.
 * Emails from known CRM contacts are auto-logged as received.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRM Fetch API] Starting fetch...");
    const result = await fetchAndLogInboxEmails();
    console.log(`[CRM Fetch API] Result: ${JSON.stringify(result)}`);
    revalidatePath("/admin/crm");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("CRM fetch emails error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch emails", fetched: 0, logged: 0, skipped: 0, errors: [error.message] },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/fetch-emails
 * Returns the IMAP configuration status (without secrets).
 */
export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = {
    host: process.env.IMAP_HOST || process.env.SMTP_HOST || "Not configured",
    port: parseInt(process.env.IMAP_PORT || "993"),
    user: process.env.IMAP_USER || process.env.SMTP_USER || "Not configured",
    hasPassword: !!(process.env.IMAP_PASS || process.env.SMTP_PASS),
    fetchDays: parseInt(process.env.IMAP_FETCH_DAYS || "7"),
    status: !!(process.env.IMAP_HOST || process.env.SMTP_HOST) ? "configured" : "not configured",
  };

  return NextResponse.json(config);
}
