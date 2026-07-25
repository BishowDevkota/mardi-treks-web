import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TrekForm } from "../trek-form";
import { ArrowLeft } from "lucide-react";

export default async function EditTrekPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trek, categories] = await Promise.all([
    prisma.trek.findUnique({
      where: { id },
      include: { itinerary: { orderBy: { dayNumber: "asc" } }, pricingTiers: true, availableDates: true, faqs: true, reviews: true, category: true, galleryImages: true },
    }),
    prisma.category.findMany({
      where: { status: "published" },
      orderBy: { sort: "asc" },
      select: {
        id: true, name: true, slug: true, icon: true,
        regions: { select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);
  if (!trek) notFound();
  return (
    <div>
      <Link href="/admin/treks" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
      <p className="mt-1 text-sm text-slate-500">{trek.title}</p>
      <TrekForm mode="edit" trek={trek} categories={categories} />
    </div>
  );
}
