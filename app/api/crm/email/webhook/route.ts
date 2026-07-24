import { NextRequest, NextResponse } from "next/server";
import { logIncomingEmail } from "@/lib/crm-email";
import { prisma } from "@/lib/prisma";

/**
 * Webhook to receive forwarded emails from external services
 * (e.g., SendGrid Inbound Parse, CloudMailin, Mailgun Routes, Gmail Pub/Sub).
 *
 * Expected payload format (SendGrid inbound parse style):
 * {
 *   "to": "contact+abc123@inbound.marditreks.com",
 *   "from": "john@example.com",
 *   "subject": "Re: Trek booking",
 *   "html": "...",
 *   "text": "..."
 * }
 *
 * The `to` address can contain a contact ID or email to match: contact+{contactId}@...
 * Or we try to match the `from` email to an existing contact.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CRM_EMAIL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CRM_EMAIL_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const token = req.headers.get("x-webhook-token") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let data: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await req.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      data = Object.fromEntries(formData.entries());
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    const fromEmail = data.from || data.sender || data.email;
    const toEmail = data.to || data.recipient;
    const subject = data.subject || "(No Subject)";
    const body = data.html || data.text || data["body-html"] || data["body-plain"] || "";

    if (!fromEmail) {
      return NextResponse.json({ error: "from email is required" }, { status: 400 });
    }

    // Try to find the contact by matching the 'to' address pattern contact+{id}@...
    let contactId: string | null = null;

    if (toEmail) {
      const match = toEmail.match(/contact\+([a-zA-Z0-9]+)@/);
      if (match) {
        const c = await prisma.crmContact.findUnique({ where: { id: match[1] }, select: { id: true } });
        if (c) contactId = c.id;
      }
    }

    // Fallback: try to match by 'from' email
    if (!contactId) {
      const contact = await prisma.crmContact.findFirst({
        where: { email: fromEmail },
        select: { id: true },
      });
      if (contact) contactId = contact.id;
    }

    if (!contactId) {
      // Can't find a matching contact — still log but return a warning
      console.warn(`[CRM Email Webhook] No contact found for from=${fromEmail}, to=${toEmail}`);
      return NextResponse.json({ warning: "No matching contact found", received: true });
    }

    await logIncomingEmail({
      contactId,
      subject,
      body,
      fromEmail,
      toEmail: toEmail || "",
    });

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error("CRM email webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle GET for webhook verification (e.g., SendGrid)
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok" });
}
