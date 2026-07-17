import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CategoryForm } from "../category-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Edit Category</h1>
      <p className="mt-1 text-sm text-slate-500">{category.name}</p>
      <CategoryForm mode="edit" category={category} />
    </div>
  );
}
