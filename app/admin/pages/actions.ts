"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function createPage(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.page.create({
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      content: formData.get("content") as string || "",
      status: formData.get("status") as string || "draft",
      metaTitle: formData.get("metaTitle") as string || null,
      metaDescription: formData.get("metaDescription") as string || null,
    },
  });

  revalidatePath("/");
  redirect("/admin/pages");
}

export async function updatePage(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.page.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      content: formData.get("content") as string || "",
      status: formData.get("status") as string || "draft",
      metaTitle: formData.get("metaTitle") as string || null,
      metaDescription: formData.get("metaDescription") as string || null,
    },
  });

  revalidatePath("/");
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.page.delete({ where: { id } });
  revalidatePath("/");
  redirect("/admin/pages");
}
