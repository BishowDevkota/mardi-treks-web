import nodemailer from "nodemailer";
import { prisma } from "./prisma";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function verifySmtpConnection() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP is not fully configured");
  }
  await getTransporter().verify();
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
  };
}

export type SendEmailToContactParams = {
  contactId: string;
  subject: string;
  body: string; // HTML
  fromEmail?: string;
  replyToMessageId?: string; // For threading replies
};

/**
 * Send an email to a CRM contact and auto-log it.
 * The contact's email address is resolved from the database.
 */
export async function sendEmailToContact({
  contactId,
  subject,
  body,
  fromEmail,
  replyToMessageId,
}: SendEmailToContactParams & { replyToMessageId?: string }) {
  const contact = await prisma.crmContact.findUnique({
    where: { id: contactId },
    select: { name: true, email: true },
  });

  if (!contact) throw new Error(`Contact ${contactId} not found`);
  if (!contact.email) throw new Error(`Contact ${contactId} has no email address`);

  const from = fromEmail || process.env.SMTP_USER || "";
  const smtpUser = process.env.SMTP_USER || "";

  // Generate a unique Message-ID
  const generatedMessageId = `<crm-${Date.now()}-${Math.random().toString(36).slice(2)}@marditreks.com>`;

  // Determine threadId: if replying, use the parent's threadId; otherwise new thread
  let threadId: string | null = null;
  if (replyToMessageId) {
    const parentEmail = await prisma.crmEmailLog.findFirst({
      where: { messageId: replyToMessageId, contactId },
      select: { threadId: true },
    });
    threadId = parentEmail?.threadId || generatedMessageId;
  } else {
    threadId = generatedMessageId;
  }

  let actualMessageId: string | undefined;

  try {
    const info = await getTransporter().sendMail({
      from: `"Mardi Treks CRM" <${smtpUser}>`,
      to: contact.email,
      subject,
      html: body,
      messageId: generatedMessageId,
      ...(replyToMessageId ? {
        inReplyTo: replyToMessageId,
        references: replyToMessageId,
      } : {}),
    });
    actualMessageId = info.messageId || generatedMessageId;
  } catch (error) {
    // Log the failed attempt
    await prisma.crmEmailLog.create({
      data: {
        contactId,
        direction: "sent",
        subject,
        body,
        fromEmail: from,
        toEmail: contact.email,
        messageId: generatedMessageId,
        threadId,
        status: "failed",
        sentAt: new Date(),
      },
    });
    throw error;
  }

  // Auto-log the successful send
  await prisma.crmEmailLog.create({
    data: {
      contactId,
      direction: "sent",
      subject,
      body,
      fromEmail: from,
      toEmail: contact.email,
      messageId: actualMessageId,
      threadId,
      status: "sent",
      sentAt: new Date(),
    },
  });

  return { messageId: actualMessageId, threadId, to: contact.email, contactName: contact.name };
}

/**
 * Send an email to an arbitrary address (not necessarily a CRM contact)
 * and optionally log it to a contact.
 */
export async function sendEmailAndLog({
  to,
  subject,
  body,
  contactId,
  fromEmail,
}: {
  to: string;
  subject: string;
  body: string;
  contactId?: string;
  fromEmail?: string;
}) {
  const from = fromEmail || process.env.SMTP_USER || "";
  const smtpUser = process.env.SMTP_USER || "";
  let messageId: string | undefined;

  try {
    const info = await getTransporter().sendMail({
      from: `"Mardi Treks CRM" <${smtpUser}>`,
      to,
      subject,
      html: body,
    });
    messageId = info.messageId;
  } catch (error) {
    if (contactId) {
      await prisma.crmEmailLog.create({
        data: {
          contactId,
          direction: "sent",
          subject,
          body,
          fromEmail: from,
          toEmail: to,
          status: "failed",
          sentAt: new Date(),
        },
      });
    }
    throw error;
  }

  if (contactId) {
    await prisma.crmEmailLog.create({
      data: {
        contactId,
        direction: "sent",
        subject,
        body,
        fromEmail: from,
        toEmail: to,
        status: "sent",
        sentAt: new Date(),
      },
    });
  }

  return { messageId };
}

/**
 * Log an incoming email (called from webhook or IMAP fetcher).
 */
export async function logIncomingEmail({
  contactId,
  subject,
  body,
  fromEmail,
  toEmail,
}: {
  contactId: string;
  subject: string;
  body: string;
  fromEmail: string;
  toEmail: string;
}) {
  return prisma.crmEmailLog.create({
    data: {
      contactId,
      direction: "received",
      subject,
      body,
      fromEmail,
      toEmail,
      status: "sent",
      sentAt: new Date(),
    },
  });
}
