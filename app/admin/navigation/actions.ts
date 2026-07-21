"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";
import { deleteFile } from "@/lib/cloudinary";

interface RegionInput {
  id?: string;
  name: string;
  categoryId: string;
}

export async function updateNavigationSettings(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const navigation = JSON.parse((formData.get("navigation") as string) || "[]");
  const categoryDropdownTreks = JSON.parse((formData.get("categoryDropdownTreks") as string) || "{}");
  const logo = (formData.get("logo") as string) || null;
  const previousLogo = (formData.get("previousLogo") as string) || null;

  const topBarContent = (formData.get("topBarContent") as string) || null;

  // If the logo changed, delete the old one from Cloudinary
  if (previousLogo && previousLogo !== logo) {
    try {
      await deleteFile(previousLogo);
    } catch (err) {
      console.error("Failed to delete old logo from Cloudinary:", err);
    }
  }

  await prisma.siteSetting.upsert({
    where: { id: "site-settings" },
    update: {
      logo,
      topBarContent,
      navigation: navigation.length > 0 ? JSON.stringify(navigation) : null,
      categoryDropdownTreks: Object.keys(categoryDropdownTreks).length > 0
        ? JSON.stringify(categoryDropdownTreks)
        : null,
    },
    create: {
      id: "site-settings",
      siteName: "Mardi Treks",
      logo,
      topBarContent,
      navigation: navigation.length > 0 ? JSON.stringify(navigation) : null,
      categoryDropdownTreks: Object.keys(categoryDropdownTreks).length > 0
        ? JSON.stringify(categoryDropdownTreks)
        : null,
    },
  });

  invalidateCachePattern(cacheKeys.pattern.layout);
  invalidateCachePattern(cacheKeys.pattern.category);
  revalidatePath("/");
  revalidatePath("/admin/navigation");
}

export async function saveCategoryRegions(regions: RegionInput[]) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  // Get existing region IDs for the affected categories
  const categoryIds = [...new Set(regions.map((r) => r.categoryId))];

  // Delete regions that are no longer in the list
  const incomingIds = regions.filter((r) => r.id).map((r) => r.id!);
  await prisma.categoryRegion.deleteMany({
    where: {
      categoryId: { in: categoryIds },
      id: { notIn: incomingIds },
    },
  });

  // Upsert regions
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    if (r.id) {
      await prisma.categoryRegion.update({
        where: { id: r.id },
        data: { name: r.name, slug: r.name.toLowerCase().replace(/\s+/g, "-"), sortOrder: i },
      });
    } else {
      await prisma.categoryRegion.create({
        data: {
          name: r.name,
          slug: r.name.toLowerCase().replace(/\s+/g, "-"),
          categoryId: r.categoryId,
          sortOrder: i,
        },
      });
    }
  }

  revalidatePath("/admin/navigation");
  revalidatePath("/");
}
