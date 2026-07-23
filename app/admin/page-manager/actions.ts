"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";

export async function savePageContent(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const pageContent: Record<string, any> = {};

  // ── Home page ──
  const homeSectionsRaw = formData.get("home_sections") as string;
  const homeSectionsParsed = homeSectionsRaw ? JSON.parse(homeSectionsRaw) : {};
  const homeWhyItems = JSON.parse(formData.get("home_why_items") as string || "[]");
  const homeInfoCards = JSON.parse(formData.get("home_contact_info_cards") as string || "[]");

  pageContent.home = {
    hero: {
      title: formData.get("home_hero_title") as string,
      titleHighlight: formData.get("home_hero_title_highlight") as string,
      description: formData.get("home_hero_description") as string,
      backgroundImage: formData.get("home_hero_background") as string,
    },
    sections: homeSectionsParsed,
    seo: {
      title: formData.get("home_seo_title") as string || "",
      description: formData.get("home_seo_description") as string || "",
      keywords: formData.get("home_seo_keywords") as string || "",
    },
    whyChooseUs: {
      heading: formData.get("home_why_heading") as string,
      subtitle: formData.get("home_why_subtitle") as string,
      bgImage: formData.get("home_why_bg") as string,
      items: homeWhyItems,
    },
    contact: {
      heading: formData.get("home_contact_heading") as string,
      description: formData.get("home_contact_description") as string,
      infoCards: homeInfoCards,
    },
  };

  // Also persist home data to homePageSettings for the frontend
  await prisma.homePageSettings.upsert({
    where: { id: "home-settings" },
    create: {
      id: "home-settings",
      heroTitle: formData.get("home_hero_title") as string,
      heroTitleHighlight: formData.get("home_hero_title_highlight") as string,
      heroDescription: formData.get("home_hero_description") as string,
      heroImage: formData.get("home_hero_background") as string,
      heroEnabled: formData.get("heroEnabled") === "on",
      featuredTrekIds: formData.get("featuredTrekIds") as string || "[]",
      featuredSectionTrekIds: formData.get("featuredSectionTrekIds") as string || "[]",
      featuredTreksHeading: homeSectionsParsed.featuredTreksHeading,
      featuredTreksDescription: homeSectionsParsed.featuredTreksDescription,
      bestSellingTreksHeading: homeSectionsParsed.bestSellingTreksHeading,
      bestSellingTreksDescription: homeSectionsParsed.bestSellingTreksDescription,
      topRatedTreksHeading: homeSectionsParsed.topRatedTreksHeading,
      topRatedTreksDescription: homeSectionsParsed.topRatedTreksDescription,
      reviewsHeading: homeSectionsParsed.reviewsHeading,
      reviewsDescription: homeSectionsParsed.reviewsDescription,
      blogHeading: homeSectionsParsed.blogHeading,
      blogDescription: homeSectionsParsed.blogDescription,
      whyChooseUsHeading: formData.get("home_why_heading") as string,
      whyChooseUsSubtitle: formData.get("home_why_subtitle") as string,
      whyChooseUsItems: JSON.stringify(homeWhyItems),
      whyChooseUsBgImage: formData.get("home_why_bg") as string,
      contactHeading: formData.get("home_contact_heading") as string,
      contactDescription: formData.get("home_contact_description") as string,
      contactInfoCards: JSON.stringify(homeInfoCards),
    },
    update: {
      heroTitle: formData.get("home_hero_title") as string,
      heroTitleHighlight: formData.get("home_hero_title_highlight") as string,
      heroDescription: formData.get("home_hero_description") as string,
      heroImage: formData.get("home_hero_background") as string,
      heroEnabled: formData.get("heroEnabled") === "on",
      featuredTrekIds: formData.get("featuredTrekIds") as string || "[]",
      featuredSectionTrekIds: formData.get("featuredSectionTrekIds") as string || "[]",
      featuredTreksHeading: homeSectionsParsed.featuredTreksHeading,
      featuredTreksDescription: homeSectionsParsed.featuredTreksDescription,
      bestSellingTreksHeading: homeSectionsParsed.bestSellingTreksHeading,
      bestSellingTreksDescription: homeSectionsParsed.bestSellingTreksDescription,
      topRatedTreksHeading: homeSectionsParsed.topRatedTreksHeading,
      topRatedTreksDescription: homeSectionsParsed.topRatedTreksDescription,
      reviewsHeading: homeSectionsParsed.reviewsHeading,
      reviewsDescription: homeSectionsParsed.reviewsDescription,
      blogHeading: homeSectionsParsed.blogHeading,
      blogDescription: homeSectionsParsed.blogDescription,
      whyChooseUsHeading: formData.get("home_why_heading") as string,
      whyChooseUsSubtitle: formData.get("home_why_subtitle") as string,
      whyChooseUsItems: JSON.stringify(homeWhyItems),
      whyChooseUsBgImage: formData.get("home_why_bg") as string,
      contactHeading: formData.get("home_contact_heading") as string,
      contactDescription: formData.get("home_contact_description") as string,
      contactInfoCards: JSON.stringify(homeInfoCards),
    },
  });

  // ── About page ──
  pageContent.about = {
    hero: {
      heading: formData.get("about_hero_heading") as string,
      description: formData.get("about_hero_description") as string,
      backgroundImage: formData.get("about_hero_background") as string,
    },
    sections: JSON.parse(formData.get("about_sections") as string || "[]"),
    seo: {
      title: formData.get("about_seo_title") as string,
      description: formData.get("about_seo_description") as string,
      keywords: formData.get("about_seo_keywords") as string || "",
    },
    whyChooseUs: {
      heading: formData.get("about_why_heading") as string,
      subtitle: formData.get("about_why_subtitle") as string,
      items: JSON.parse(formData.get("about_why_items") as string || "[]"),
      bgImage: formData.get("about_why_bg") as string,
    },
    team: JSON.parse(formData.get("about_team") as string || "[]"),
    gallery: JSON.parse(formData.get("about_gallery") as string || "[]"),
  };

  // ── Contact page ──
  pageContent.contact = {
    hero: {
      heading: formData.get("contact_hero_heading") as string,
      description: formData.get("contact_hero_description") as string,
      backgroundImage: formData.get("contact_hero_background") as string,
    },
    mapIframe: formData.get("contact_map_iframe") as string,
    infoCards: JSON.parse(formData.get("contact_info_cards") as string || "[]"),
    seo: {
      title: formData.get("contact_seo_title") as string,
      description: formData.get("contact_seo_description") as string,
      keywords: formData.get("contact_seo_keywords") as string || "",
    },
  };

  // ── Blog page ──
  pageContent.blog = {
    hero: {
      heading: formData.get("blog_hero_heading") as string,
      description: formData.get("blog_hero_description") as string,
      backgroundImage: formData.get("blog_hero_background") as string,
    },
    seo: {
      title: formData.get("blog_seo_title") as string,
      description: formData.get("blog_seo_description") as string,
      keywords: formData.get("blog_seo_keywords") as string || "",
    },
  };

  // ── Footer ──
  pageContent.footer = {
    brandDescription: formData.get("footer_brand_description") as string,
    email: formData.get("footer_email") as string,
    phone: formData.get("footer_phone") as string,
    address: formData.get("footer_address") as string,
    socialLinks: JSON.parse(formData.get("footer_social_links") as string || "[]"),
    copyright: formData.get("footer_copyright") as string,
  };

  await prisma.siteSetting.upsert({
    where: { id: "site-settings" },
    create: { id: "site-settings", pageContent: JSON.stringify(pageContent) },
    update: { pageContent: JSON.stringify(pageContent) },
  });

  invalidateCachePattern(cacheKeys.pattern.home);
  invalidateCachePattern(cacheKeys.pattern.treks);
  invalidateCachePattern(cacheKeys.pattern.site);
  invalidateCachePattern(cacheKeys.pattern.blog);
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/blog");
  revalidatePath("/", "layout");
  revalidatePath("/admin/page-manager");
  redirect("/admin/page-manager");
}
