import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TravellerForm } from "./form";

export default async function NewTravellerPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  let traveller = null;

  if (id) {
    traveller = await prisma.traveller.findUnique({
      where: { id },
      include: { contact: { select: { name: true } }, user: { select: { name: true, email: true } } },
    });
    if (!traveller) notFound();
  }

  // Get all published treks for the completed treks selector
  const treks = await prisma.trek.findMany({
    where: { status: "published" },
    select: { id: true, title: true, slug: true, duration: true, difficulty: true, price: true, region: true },
    orderBy: { title: "asc" },
  });

  // Get all CRM contacts for linking
  const contacts = await prisma.crmContact.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // Get all users for linking
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/crm/travellers"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {traveller ? "Edit Traveller" : "New Traveller"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {traveller ? "Update traveller details and completed treks" : "Register a new traveller and link completed treks"}
          </p>
        </div>
      </div>

      {/* Form */}
      <TravellerForm
        traveller={traveller ? JSON.parse(JSON.stringify({ ...traveller, completedTrekIds: traveller.completedTrekIds ? JSON.parse(traveller.completedTrekIds) : [] })) : null}
        treks={JSON.parse(JSON.stringify(treks))}
        contacts={JSON.parse(JSON.stringify(contacts))}
        users={JSON.parse(JSON.stringify(users))}
      />
    </div>
  );
}
