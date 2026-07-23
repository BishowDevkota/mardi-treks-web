"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const socialLinks = JSON.parse((formData.get("socialLinks") as string) || "[]");
  const navigation = JSON.parse((formData.get("navigation") as string) || "[]");

  await prisma.siteSetting.upsert({
    where: { id: "site-settings" },
    update: {
      siteName: formData.get("siteName") as string,
      tagline: formData.get("tagline") as string || null,
      description: formData.get("description") as string || null,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      logo: formData.get("logo") as string || null,
      socialLinks: socialLinks.length > 0 ? JSON.stringify(socialLinks) : null,
      navigation: navigation.length > 0 ? JSON.stringify(navigation) : null,
      defaultMetaTitle: formData.get("defaultMetaTitle") as string || null,
      defaultMetaDescription: formData.get("defaultMetaDescription") as string || null,
      defaultKeywords: formData.get("defaultKeywords") as string || null,
      defaultOgImage: formData.get("defaultOgImage") as string || null,
    },
    create: {
      id: "site-settings",
      siteName: formData.get("siteName") as string,
    },
  });

  invalidateCachePattern(cacheKeys.pattern.layout);
  invalidateCachePattern(cacheKeys.pattern.site);
  revalidatePath("/", "layout");
}
