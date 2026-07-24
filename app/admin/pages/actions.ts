"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";
import { deleteFile } from "@/lib/cloudinary";

function normalizeSlug(value: FormDataEntryValue | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-");
}

export async function createPage(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.page.create({
    data: {
      title: formData.get("title") as string,
      slug: normalizeSlug(formData.get("slug")),
      content: formData.get("content") as string || "",
      heroImage: formData.get("heroImage") as string || null,
      heroDescription: formData.get("heroDescription") as string || null,
      status: formData.get("status") as string || "draft",
      metaTitle: formData.get("metaTitle") as string || null,
      metaDescription: formData.get("metaDescription") as string || null,
    },
  });

  invalidateCachePattern(cacheKeys.pattern.site);
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

export async function updatePage(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const currentPage = await prisma.page.findUnique({
    where: { id },
    select: { heroImage: true },
  });
  const heroImage = formData.get("heroImage") as string || null;

  if (currentPage?.heroImage && currentPage.heroImage !== heroImage) {
    deleteFile(currentPage.heroImage).catch(() => {});
  }

  await prisma.page.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: normalizeSlug(formData.get("slug")),
      content: formData.get("content") as string || "",
      heroImage,
      heroDescription: formData.get("heroDescription") as string || null,
      status: formData.get("status") as string || "draft",
      metaTitle: formData.get("metaTitle") as string || null,
      metaDescription: formData.get("metaDescription") as string || null,
    },
  });

  invalidateCachePattern(cacheKeys.pattern.site);
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const page = await prisma.page.findUnique({
    where: { id },
    select: { heroImage: true },
  });
  if (page?.heroImage) {
    await deleteFile(page.heroImage).catch(() => {});
  }
  await prisma.page.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}
