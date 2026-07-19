"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function updateUserRole(id: string, role: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id },
    data: { role },
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function sendBulkEmail(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const subject = (formData.get("subject") as string)?.trim();
  const html = (formData.get("html") as string)?.trim();
  const recipientIds = JSON.parse((formData.get("recipientIds") as string) || "[]");

  if (!subject || !html) throw new Error("Subject and message are required");
  if (recipientIds.length === 0) throw new Error("No recipients selected");

  const users = await prisma.user.findMany({
    where: { id: { in: recipientIds }, email: { not: "" } },
    select: { id: true, name: true, email: true },
  });

  if (users.length === 0) throw new Error("No users with email addresses found");

  const siteName = "Mardi Treks";
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const user of users) {
    const userName = user.name || "there";
    const personalizedSubject = subject.replaceAll("{name}", userName);
    const personalizedHtml = html.replaceAll("{name}", userName);

    try {
      await transporter.sendMail({
        from: `"${siteName}" <${process.env.SMTP_USER}>`,
        to: user.email!,
        subject: personalizedSubject,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            ${personalizedHtml}
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;" />
            <p style="font-size:12px;color:#64748b;">
              You received this email because you are registered with ${siteName}.
              <br/>${siteName} &mdash; Nepal
            </p>
          </div>
        `,
      });
      results.sent++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Failed to send to ${user.email}: ${err.message}`);
    }
  }

  revalidatePath("/admin/users");
  return results;
}
