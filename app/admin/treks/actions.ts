"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function createTrek(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const categoryId = (formData.get("categoryId") as string) || null;

  const data: any = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    subtitle: formData.get("subtitle") as string || null,
    heroImage: formData.get("heroImage") as string || null,
    heroSubtitle: formData.get("heroSubtitle") as string || null,
    heroBadge: formData.get("heroBadge") as string || null,
    price: parseFloat(formData.get("price") as string),
    duration: parseInt(formData.get("duration") as string),
    difficulty: formData.get("difficulty") as string,
    region: formData.get("region") as string,
    maxGroupSize: parseInt(formData.get("maxGroupSize") as string) || 12,
    overview: formData.get("overview") as string || "",
    inclusions: formData.get("inclusions") as string || "[]",
    exclusions: formData.get("exclusions") as string || "[]",
    status: formData.get("status") as string || "draft",
    metaTitle: formData.get("metaTitle") as string || null,
    metaDescription: formData.get("metaDescription") as string || null,
    ogImage: formData.get("ogImage") as string || null,
    // Map fields
    geoJsonUrl: formData.get("geoJsonUrl") as string || null,
    geoJsonData: formData.get("geoJsonData") as string || null,
    waypoints: formData.get("waypoints") as string || null,
    centerLat: parseFloat(formData.get("centerLat") as string) || null,
    centerLng: parseFloat(formData.get("centerLng") as string) || null,
    zoom: parseFloat(formData.get("zoom") as string) || null,
    pitch: parseFloat(formData.get("pitch") as string) || null,
    // Custom sections
    customSections: formData.get("customSections") as string || null,
    // Add-ons
    addons: formData.get("addons") as string || "[]",
  };

  const itinerary = JSON.parse(formData.get("itinerary") as string || "[]");
  const pricingTiers = JSON.parse(formData.get("pricingTiers") as string || "[]");
  const faqs = JSON.parse(formData.get("faqs") as string || "[]");
  const gallery = JSON.parse(formData.get("gallery") as string || "[]");

  await prisma.trek.create({
    data: {
      ...data,
      category: categoryId ? { connect: { id: categoryId } } : undefined,
      itinerary: { create: itinerary },
      pricingTiers: { create: pricingTiers },
      faqs: { create: faqs },
      galleryImages: {
        create: gallery.map((g: any) => ({
          imageId: g.imageId,
          alt: g.alt || "",
          caption: g.caption || "",
        })),
      },
    },
  });

  revalidatePath("/treks");
  redirect("/admin/treks");
}

export async function updateTrek(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const categoryId = (formData.get("categoryId") as string) || null;

  const data: any = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    subtitle: formData.get("subtitle") as string || null,
    heroImage: formData.get("heroImage") as string || null,
    heroSubtitle: formData.get("heroSubtitle") as string || null,
    heroBadge: formData.get("heroBadge") as string || null,
    price: parseFloat(formData.get("price") as string),
    duration: parseInt(formData.get("duration") as string),
    difficulty: formData.get("difficulty") as string,
    region: formData.get("region") as string,
    maxGroupSize: parseInt(formData.get("maxGroupSize") as string) || 12,
    overview: formData.get("overview") as string || "",
    inclusions: formData.get("inclusions") as string || "[]",
    exclusions: formData.get("exclusions") as string || "[]",
    status: formData.get("status") as string || "draft",
    metaTitle: formData.get("metaTitle") as string || null,
    metaDescription: formData.get("metaDescription") as string || null,
    ogImage: formData.get("ogImage") as string || null,
    // Map fields
    geoJsonUrl: formData.get("geoJsonUrl") as string || null,
    geoJsonData: formData.get("geoJsonData") as string || null,
    waypoints: formData.get("waypoints") as string || null,
    centerLat: parseFloat(formData.get("centerLat") as string) || null,
    centerLng: parseFloat(formData.get("centerLng") as string) || null,
    zoom: parseFloat(formData.get("zoom") as string) || null,
    pitch: parseFloat(formData.get("pitch") as string) || null,
    // Custom sections
    customSections: formData.get("customSections") as string || null,
    // Add-ons
    addons: formData.get("addons") as string || "[]",
  };

  const itinerary = JSON.parse(formData.get("itinerary") as string || "[]");
  const pricingTiers = JSON.parse(formData.get("pricingTiers") as string || "[]");
  const faqs = JSON.parse(formData.get("faqs") as string || "[]");
  const gallery = JSON.parse(formData.get("gallery") as string || "[]");

  await prisma.$transaction(async (tx) => {
    await tx.itineraryDay.deleteMany({ where: { trekId: id } });
    await tx.pricingTier.deleteMany({ where: { trekId: id } });
    await tx.trekFaq.deleteMany({ where: { trekId: id } });
    await tx.trekGalleryImage.deleteMany({ where: { trekId: id } });

    await tx.trek.update({
      where: { id },
      data: {
        ...data,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        itinerary: { create: itinerary },
        pricingTiers: { create: pricingTiers },
        faqs: { create: faqs },
        galleryImages: {
          create: gallery.map((g: any) => ({
            imageId: g.imageId,
            alt: g.alt || "",
            caption: g.caption || "",
          })),
        },
      },
    });
  });

  revalidatePath("/treks");
  redirect("/admin/treks");
}

export async function deleteTrek(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");
  await prisma.trek.delete({ where: { id } });
  revalidatePath("/treks");
  redirect("/admin/treks");
}
