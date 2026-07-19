"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";

function invalidateCategoryCache() {
  invalidateCachePattern(cacheKeys.pattern.category);
  invalidateCachePattern(cacheKeys.pattern.layout);
  invalidateCachePattern(cacheKeys.pattern.treks);
}

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.category.create({
    data: {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      icon: (formData.get("icon") as string) || null,
      sort: parseInt(formData.get("sort") as string) || 0,
    },
  });

  invalidateCategoryCache();
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.category.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      icon: (formData.get("icon") as string) || null,
      sort: parseInt(formData.get("sort") as string) || 0,
    },
  });

  invalidateCategoryCache();
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");
  await prisma.category.delete({ where: { id } });
  invalidateCategoryCache();
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}
