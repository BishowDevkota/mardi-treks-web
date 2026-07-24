import { prisma } from "@/lib/prisma";
import { CrmCommunicationClient } from "./client";

export default async function CrmCommunicationPage() {
  const [contacts, customers] = await Promise.all([
    prisma.crmContact.findMany({
      where: { email: { not: null }, status: { not: "blocked" } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "customer", email: { not: "" } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const seenEmails = new Set<string>();
  const recipients = [
    ...customers.map((customer) => ({
      key: `user:${customer.id}`,
      name: customer.name || customer.email,
      email: customer.email,
      source: "Customer" as const,
    })),
    ...contacts.map((contact) => ({
      key: `contact:${contact.id}`,
      name: contact.name,
      email: contact.email!,
      source: "CRM contact" as const,
    })),
  ].filter((recipient) => {
    const email = recipient.email.trim().toLowerCase();
    if (!email || seenEmails.has(email)) return false;
    seenEmails.add(email);
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Send customer email</h1>
        <p className="mt-1 text-sm text-slate-500">
          Send to one customer, choose several, or select everyone.
        </p>
      </div>
      <CrmCommunicationClient recipients={recipients} />
    </div>
  );
}
