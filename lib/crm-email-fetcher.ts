import { prisma } from "./prisma";

/**
 * Fetch recent unread emails from the configured IMAP/SMTP inbox
 * and auto-log them as received CrmEmailLog entries.
 *
 * Works with Gmail app passwords or any IMAP-enabled email account.
 * Configure via:
 *   IMAP_HOST=imap.gmail.com
 *   IMAP_PORT=993
 *   IMAP_USER=your-email@gmail.com
 *   IMAP_PASS=your-app-password
 *   IMAP_FETCH_DAYS=7   (how far back to look, default 7)
 */

interface FetchedEmail {
  messageId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  receivedAt: Date;
  uid: number;
  inReplyTo?: string;    // Message-ID this is replying to
  references?: string;   // Thread references
}

/**
 * Connect to IMAP and fetch recent emails, logging them to the CRM.
 */
export async function fetchAndLogInboxEmails(): Promise<{
  fetched: number;
  logged: number;
  skipped: number;
  errors: string[];
}> {
  const result = { fetched: 0, logged: 0, skipped: 0, errors: [] as string[] };

  const host = process.env.IMAP_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.IMAP_PORT || "993");
  const user = process.env.IMAP_USER || process.env.SMTP_USER;
  const pass = process.env.IMAP_PASS || process.env.SMTP_PASS;
  const fetchDays = parseInt(process.env.IMAP_FETCH_DAYS || "7");

  if (!host || !user || !pass) {
    result.errors.push("IMAP not configured — set IMAP_HOST, IMAP_USER, IMAP_PASS (or reuse SMTP_ vars)");
    return result;
  }

  let emails: FetchedEmail[] = [];

  try {
    console.log(`[CRM Fetcher] Connecting to IMAP: ${host}:${port} as ${user}`);
    emails = await fetchEmailsViaIMAP({ host, port, user, pass, fetchDays });
    console.log(`[CRM Fetcher] Fetched ${emails.length} emails from inbox`);
    console.log(`[CRM Fetcher] Senders: ${emails.map(e => e.fromEmail).join(", ")}`);
  } catch (error: any) {
    result.errors.push(`IMAP error: ${error.message}`);
    // Fallback
    try {
      emails = await fetchEmailsViaFallback({ user, pass, fetchDays });
    } catch (fallbackError: any) {
      result.errors.push(`Fallback also failed: ${fallbackError.message}`);
      return result;
    }
  }

  result.fetched = emails.length;

  // Message-ID is stable across fetches and prevents repeat imports.
  const messageIds = emails.map((email) => email.messageId).filter(Boolean);
  const existingIds = new Set(
    (await prisma.crmEmailLog.findMany({
      where: { messageId: { in: messageIds } },
      select: { messageId: true },
    }))
      .map((email) => email.messageId)
      .filter((id): id is string => Boolean(id))
  );

  for (const email of emails) {
    try {
      if (existingIds.has(email.messageId)) {
        result.skipped++;
        continue;
      }

      // Find matching CRM contact by email
      const contact = await prisma.crmContact.findFirst({
        where: { email: email.fromEmail },
        select: { id: true, name: true },
      });

      if (!contact) {
        console.log(`[CRM Fetcher] Skipped — no contact found for ${email.fromEmail} (subject: "${email.subject}")`);
        result.skipped++;
        continue;
      }

      console.log(`[CRM Fetcher] Matched ${email.fromEmail} → contact "${contact.name}"`);

      // Check for duplicate (same subject + from within last hour)
      const recentDupe = await prisma.crmEmailLog.findFirst({
        where: {
          contactId: contact.id,
          fromEmail: email.fromEmail,
          subject: email.subject,
          sentAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // within last hour
          },
        },
      });

      if (recentDupe) {
        result.skipped++;
        continue;
      }

      // Resolve threadId: check if this is a reply to a CRM-sent email
      let threadId: string | null = null;
      if (email.inReplyTo) {
        const parentEmail = await prisma.crmEmailLog.findFirst({
          where: { messageId: email.inReplyTo },
          select: { threadId: true },
        });
        threadId = parentEmail?.threadId || null;
      }
      // Fallback: use the first reference as threadId
      if (!threadId && email.references) {
        const firstRef = email.references.split(/\s+/)[0];
        const refEmail = await prisma.crmEmailLog.findFirst({
          where: { messageId: firstRef },
          select: { threadId: true },
        });
        threadId = refEmail?.threadId || null;
      }

      // Auto-log the received email
      await prisma.crmEmailLog.create({
        data: {
          contactId: contact.id,
          direction: "received",
          subject: email.subject,
          body: email.htmlBody || email.textBody || "",
          fromEmail: email.fromEmail,
          toEmail: user,
          messageId: email.messageId,
          threadId,
          status: "received",
          sentAt: email.receivedAt,
        },
      });

      existingIds.add(email.messageId);
      result.logged++;
    } catch (err: any) {
      result.errors.push(`Failed to log email from ${email.fromEmail}: ${err.message}`);
    }
  }

  return result;
}

/**
 * Connect via IMAP and fetch recent emails using imapflow.
 */
async function fetchEmailsViaIMAP({
  host,
  port,
  user,
  pass,
  fetchDays,
}: {
  host: string;
  port: number;
  user: string;
  pass: string;
  fetchDays: number;
}): Promise<FetchedEmail[]> {
  const { ImapFlow } = await import("imapflow");

  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();

  const emails: FetchedEmail[] = [];
  const sinceDate = new Date(Date.now() - fetchDays * 24 * 60 * 60 * 1000);

  try {
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Search for ALL messages from the last N days
      const searchResult = await client.search({ since: sinceDate });
      const uids = searchResult ? searchResult.slice(-50) : [];

      for (const uid of uids) {
        try {
          // Fetch with full source — most reliable way to get all content
          const msg = await client.fetchOne(uid, {
            uid: true,
            envelope: true,
            source: true,
          });

          if (!msg || !msg.envelope) continue;

          const from = msg.envelope.from?.[0];
          if (!from || !from.address) continue;

          // Skip auto-generated / no-reply emails
          if (from.address.includes("noreply") || from.address.includes("no-reply")) continue;

          // Parse body from raw source
          const sourceStr = typeof msg.source === "string" ? msg.source : msg.source?.toString() || "";
          let htmlBody = "";
          let textBody = "";
          let inReplyTo = "";
          let references = "";

          if (sourceStr) {
            // Extract threading headers
            const msgIdMatch = sourceStr.match(/^Message-ID:\s*(<[^>]+>)/im);
            const inReplyToMatch = sourceStr.match(/^In-Reply-To:\s*(<[^>]+>)/im);
            const refsMatch = sourceStr.match(/^References:\s*(.+)$/im);

            inReplyTo = inReplyToMatch?.[1]?.trim() || "";
            references = refsMatch?.[1]?.trim() || "";

            // Simple MIME parser for the body parts
            const htmlMatch = sourceStr.match(/Content-Type:\s*text\/html[\s\S]*?(?:\r\n\r\n|\n\n)([\s\S]*?)(?:\r?\n--|$)/i);
            if (htmlMatch) {
              htmlBody = htmlMatch[1].replace(/\r?\n/g, "").trim();
            }
            const textMatch = sourceStr.match(/Content-Type:\s*text\/plain[\s\S]*?(?:\r\n\r\n|\n\n)([\s\S]*?)(?:\r?\n--|$)/i);
            if (textMatch) {
              textBody = textMatch[1].replace(/\r?\n/g, "").trim();
            }
            if (!htmlBody && !textBody) {
              const bodyMatch = sourceStr.match(/(?:\r\n\r\n|\n\n)([\s\S]*)$/);
              if (bodyMatch) {
                textBody = bodyMatch[1].substring(0, 5000).trim();
              }
            }
          }

          // Resolve threadId from References/In-Reply-To chain
          const allRefs = [inReplyTo, ...references.split(/\s+/)].filter(Boolean);
          let threadId: string | null = null;
          for (const ref of allRefs) {
            const parent = await prisma.crmEmailLog.findFirst({
              where: { messageId: ref },
              select: { threadId: true },
            });
            if (parent?.threadId) {
              threadId = parent.threadId;
              break;
            }
          }

          emails.push({
            messageId: msg.envelope.messageId || inReplyTo || `${uid}`,
            fromEmail: from.address,
            fromName: from.name || from.address,
            subject: msg.envelope.subject || "(No Subject)",
            htmlBody,
            textBody,
            receivedAt: msg.envelope.date || new Date(),
            uid: typeof uid === "number" ? uid : parseInt(String(uid)),
            inReplyTo: inReplyTo || undefined,
            references: references || undefined,
          });
        } catch {
          // Skip individual message errors
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return emails;
}

/**
 * Fallback: Use Gmail's RSS/Atom feed or basic fetch.
 * This is a simplified approach using app-specific passwords.
 */
async function fetchEmailsViaFallback({
  user,
  pass,
  fetchDays,
}: {
  user: string;
  pass: string;
  fetchDays: number;
}): Promise<FetchedEmail[]> {
  // If IMAP fails, we can still use the Gmail API via fetch
  // This requires a Gmail API key and OAuth setup
  // For now, return empty and report the IMAP error
  throw new Error(
    "IMAP connection failed and no fallback email source is configured. " +
    "For Gmail, ensure you're using an App Password and have IMAP enabled in Gmail settings."
  );
}
