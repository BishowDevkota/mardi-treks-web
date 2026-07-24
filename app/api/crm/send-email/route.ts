import { auth } from "@/lib/auth";
import { sendEmailAndLog } from "@/lib/crm-email";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string } | undefined)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const recipientKeys: string[] = Array.isArray(payload.recipientKeys)
      ? Array.from(new Set<string>(
          payload.recipientKeys.filter((key: unknown): key is string => typeof key === "string")
        ))
      : [];
    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const message = typeof payload.body === "string" ? payload.body.trim() : "";

    if (!recipientKeys.length || !subject || !message) {
      return NextResponse.json(
        { error: "Choose at least one recipient and enter a subject and message." },
        { status: 400 }
      );
    }

    const userIds = recipientKeys.filter((key) => key.startsWith("user:")).map((key) => key.slice(5));
    const contactIds = recipientKeys.filter((key) => key.startsWith("contact:")).map((key) => key.slice(8));
    const [users, contacts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds }, role: "customer", email: { not: "" } },
        select: { id: true, name: true, email: true },
      }),
      prisma.crmContact.findMany({
        where: { id: { in: contactIds }, email: { not: null }, status: { not: "blocked" } },
        select: { id: true, name: true, email: true },
      }),
    ]);

    const recipients = [
      ...users.map((user) => ({ name: user.name || user.email, email: user.email, contactId: undefined })),
      ...contacts.map((contact) => ({ name: contact.name, email: contact.email!, contactId: contact.id })),
    ];
    const uniqueRecipients = [...new Map(recipients.map((recipient) => [recipient.email.toLowerCase(), recipient])).values()];
    const result = { sent: 0, failed: 0, errors: [] as string[] };

    for (const recipient of uniqueRecipients) {
      const personalizedSubject = subject.replaceAll("{{name}}", recipient.name);
      const personalizedBody = escapeHtml(message)
        .replaceAll("{{name}}", escapeHtml(recipient.name))
        .replaceAll("\n", "<br />");

      try {
        await sendEmailAndLog({
          to: recipient.email,
          subject: personalizedSubject,
          body: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;line-height:1.65;color:#334155">${personalizedBody}</div>`,
          contactId: recipient.contactId,
        });
        result.sent++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `${recipient.email}: ${error instanceof Error ? error.message : "send failed"}`
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
