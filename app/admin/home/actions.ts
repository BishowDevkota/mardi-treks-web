"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";

export async function updateHomeSettings(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const featuredTrekIdsRaw = formData.get("featuredTrekIds") as string;
  const featuredTrekIds = featuredTrekIdsRaw ? JSON.parse(featuredTrekIdsRaw) : [];
  const featuredSectionIdsRaw = formData.get("featuredSectionTrekIds") as string;
  const featuredSectionIds = featuredSectionIdsRaw ? JSON.parse(featuredSectionIdsRaw) : [];

  // Why Choose Us items
  const whyChooseUsItemsRaw = formData.get("whyChooseUsItems") as string;
  const whyChooseUsItems = whyChooseUsItemsRaw ? JSON.parse(whyChooseUsItemsRaw) : null;

  const data: any = {
    featuredTrekIds: JSON.stringify(featuredTrekIds),
    featuredSectionTrekIds: JSON.stringify(featuredSectionIds),

    // Hero
    heroEnabled: formData.get("heroEnabled") === "on",
    heroTitle: (formData.get("heroTitle") as string) || null,
    heroTitleHighlight: (formData.get("heroTitleHighlight") as string) || null,
    heroDescription: (formData.get("heroDescription") as string) || null,
    heroImage: (formData.get("heroImage") as string) || null,

    // Section headings
    featuredTreksHeading: (formData.get("featuredTreksHeading") as string) || null,
    featuredTreksDescription: (formData.get("featuredTreksDescription") as string) || null,
    bestSellingTreksHeading: (formData.get("bestSellingTreksHeading") as string) || null,
    bestSellingTreksDescription: (formData.get("bestSellingTreksDescription") as string) || null,
    topRatedTreksHeading: (formData.get("topRatedTreksHeading") as string) || null,
    topRatedTreksDescription: (formData.get("topRatedTreksDescription") as string) || null,
    reviewsHeading: (formData.get("reviewsHeading") as string) || null,
    reviewsDescription: (formData.get("reviewsDescription") as string) || null,
    blogHeading: (formData.get("blogHeading") as string) || null,
    blogDescription: (formData.get("blogDescription") as string) || null,

    // Contact section
    contactHeading: (formData.get("contactHeading") as string) || null,
    contactDescription: (formData.get("contactDescription") as string) || null,
    contactInfoCards: (formData.get("contactInfoCards") as string) || null,

    // Why Choose Us
    whyChooseUsEnabled: formData.get("whyChooseUsEnabled") === "on",
    whyChooseUsSubtitle: (formData.get("whyChooseUsSubtitle") as string) || null,
    whyChooseUsHeading: (formData.get("whyChooseUsHeading") as string) || null,
    whyChooseUsItems: whyChooseUsItems ? JSON.stringify(whyChooseUsItems) : null,
    whyChooseUsBgImage: (formData.get("whyChooseUsBgImage") as string) || null,
  };

  await prisma.homePageSettings.upsert({
    where: { id: "home-settings" },
    update: data,
    create: { id: "home-settings", ...data },
  });

  invalidateCachePattern(cacheKeys.pattern.home);
  invalidateCachePattern(cacheKeys.pattern.treks);
  revalidatePath("/", "layout");
  revalidatePath("/admin/home");
  redirect("/admin/home");
}
