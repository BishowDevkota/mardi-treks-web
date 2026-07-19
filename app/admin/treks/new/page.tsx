import { prisma } from "@/lib/prisma";
import { TrekForm } from "../trek-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewTrekPage() {
  const categories = await prisma.category.findMany({
    where: { status: "published" },
    orderBy: { sort: "asc" },
    select: {
      id: true, name: true, slug: true, icon: true,
      regions: { select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div>
      <Link href="/admin/treks" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">New Product</h1>
      <p className="mt-1 text-sm text-slate-500">Create a new product (trek, tour, climb, etc.) with rich text, pricing, itinerary, and more.</p>
      <TrekForm mode="create" categories={categories} />
    </div>
  );
}
