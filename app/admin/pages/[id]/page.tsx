import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageForm } from "../page-form";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Edit Page</h1>
      <p className="mt-1 text-sm text-slate-500">{page.title}</p>
      <PageForm mode="edit" page={page} />
    </div>
  );
}
