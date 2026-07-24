import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CrmContactForm } from "./form";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; userId?: string; name?: string; email?: string }>;
}) {
  const { id, userId: prefillUserId, name: prefillName, email: prefillEmail } = await searchParams;
  let contact = null;
  let users: any[] = [];

  if (id) {
    contact = await prisma.crmContact.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    if (!contact) notFound();
  }

  users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const treks = await prisma.trek.findMany({
    where: { status: "published" },
    select: { id: true, title: true, slug: true, duration: true, difficulty: true, price: true, region: true },
    orderBy: { title: "asc" },
  });

  // Pre-fill from virtual user (Link to CRM)
  const prefillData = prefillUserId ? {
    name: prefillName || "",
    email: prefillEmail || "",
    userId: prefillUserId,
  } : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/crm/contacts" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {contact ? "Edit Contact" : prefillUserId ? "Link User to CRM" : "New Contact"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {contact ? "Update contact details" : prefillUserId ? "This registered user will become a CRM contact" : "Add a new lead or customer to your CRM"}
          </p>
        </div>
      </div>

      {/* Form */}
      <CrmContactForm
        contact={contact ? JSON.parse(JSON.stringify(contact)) : null}
        users={JSON.parse(JSON.stringify(users))}
        treks={JSON.parse(JSON.stringify(treks))}
        prefill={prefillData}
      />
    </div>
  );
}
