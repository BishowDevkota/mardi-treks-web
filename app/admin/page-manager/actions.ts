"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";

export async function savePageContent(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  // Load existing pageContent first so we can preserve sections that aren't
  // in the current form submission (e.g. saving from About tab shouldn't wipe Home data).
  const existingSettings = await prisma.siteSetting.findUnique({
    where: { id: "site-settings" },
    select: { pageContent: true },
  });
  let existingPageContent: Record<string, any> = {};
  if (existingSettings?.pageContent) {
    try { existingPageContent = JSON.parse(existingSettings.pageContent); } catch {}
  }

  const pageContent: Record<string, any> = { ...existingPageContent };

  // ── Home page (only build when the Home tab's fields are in the form) ──
  const hasHomeFields = formData.has("home_hero_title");
  const homeSectionsRaw = formData.get("home_sections") as string | null;
  const homeSectionsParsed = homeSectionsRaw ? JSON.parse(homeSectionsRaw) : {};
  const homeWhyItems = JSON.parse((formData.get("home_why_items") as string) || "[]");
  const homeInfoCards = JSON.parse((formData.get("home_contact_info_cards") as string) || "[]");
  if (hasHomeFields) {
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
  }

  // Also persist home data to homePageSettings for the frontend
  // Only update featuredTrekIds/featuredSectionTrekIds when the Home tab form
  // actually submitted them — otherwise preserve existing values to avoid
  // wiping treks when saving from About/Blog/Contact/Footer tabs.
  const hasFeaturedTrekIds = formData.has("featuredTrekIds");
  if (hasHomeFields && !hasFeaturedTrekIds) {
    const existing = await prisma.homePageSettings.findUnique({
      where: { id: "home-settings" },
      select: { featuredTrekIds: true, featuredSectionTrekIds: true },
    });
    const homeUpdate: any = {
      heroTitle: formData.get("home_hero_title") as string,
      heroTitleHighlight: formData.get("home_hero_title_highlight") as string,
      heroDescription: formData.get("home_hero_description") as string,
      heroImage: formData.get("home_hero_background") as string,
      heroEnabled: formData.get("heroEnabled") === "on",
      featuredTrekIds: existing?.featuredTrekIds ?? "[]",
      featuredSectionTrekIds: existing?.featuredSectionTrekIds ?? "[]",
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
    };
    // create block for upsert (only used when row doesn't exist yet)
    await prisma.homePageSettings.upsert({
      where: { id: "home-settings" },
      create: { id: "home-settings", ...homeUpdate },
      update: homeUpdate,
    });
  } else if (hasHomeFields) {
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
  }

  // ── About page (only when the About tab was visible) ──
  if (formData.has("about_hero_heading")) {
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
      // WhyChooseUs removed — the About page reads it from Home settings
      team: JSON.parse(formData.get("about_team") as string || "[]"),
      gallery: JSON.parse(formData.get("about_gallery") as string || "[]"),
    };
  }

  // ── Contact page (only when the Contact tab was visible) ──
  if (formData.has("contact_hero_heading")) {
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
  }

  // ── Blog page (only when the Blog tab was visible) ──
  if (formData.has("blog_hero_heading")) {
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
  }

  // ── Footer (only when the Footer tab was visible) ──
  if (formData.has("footer_email")) {
    pageContent.footer = {
      email: formData.get("footer_email") as string,
      phone: formData.get("footer_phone") as string,
      address: formData.get("footer_address") as string,
      socialLinks: JSON.parse(formData.get("footer_social_links") as string || "[]"),
      copyright: formData.get("footer_copyright") as string,
      trustedBadge: formData.get("footer_trusted_badge") as string || "Trusted & Certified",
      associatedHeading: formData.get("footer_associated_heading") as string || "We're Associated With",
      partners: JSON.parse(formData.get("footer_partners") as string || "[]"),
      activitiesHeading: formData.get("footer_activities_heading") as string || "Activities",
      companyHeading: formData.get("footer_company_heading") as string || "Company",
      companyLinks: JSON.parse(formData.get("footer_company_links") as string || "[]"),
      usefulLinksHeading: formData.get("footer_useful_links_heading") as string || "Useful Links",
      usefulLinks: JSON.parse(formData.get("footer_useful_links") as string || "[]"),
      recommendedLabel: formData.get("footer_recommended_label") as string || "Recommended On:",
      recommendedOn: JSON.parse(formData.get("footer_recommended_on") as string || "[]"),
      followUsLabel: formData.get("footer_follow_us_label") as string || "Follow Us On:",
      card1Title: formData.get("footer_card1_title") as string || "Mardi Treks",
      card2Title: formData.get("footer_card2_title") as string || "Speak with a Representative",
      representative: JSON.parse(formData.get("footer_representative") as string || "{}"),
      card3Title: formData.get("footer_card3_title") as string || "Recognitions",
      recognitions: JSON.parse(formData.get("footer_recognitions") as string || "[]"),
      bottomLinks: JSON.parse(formData.get("footer_bottom_links") as string || "[]"),
    };
  }

  await prisma.siteSetting.upsert({
    where: { id: "site-settings" },
    create: { id: "site-settings", pageContent: JSON.stringify(pageContent) },
    update: { pageContent: JSON.stringify(pageContent) },
  });

  // Sync team members to Prisma TeamMember table (for individual detail pages)
  const teamMembers: Array<{ name: string; slug?: string; role: string; image?: string; bio?: string }> =
    JSON.parse(formData.get("about_team") as string || "[]");
  for (const member of teamMembers) {
    if (!member.slug && !member.name) continue;
    const slug = member.slug || member.name.toLowerCase().replace(/\s+/g, "-");
    await prisma.teamMember.upsert({
      where: { slug },
      create: {
        name: member.name,
        slug,
        role: member.role,
        image: member.image || null,
        bio: member.bio || `<p>${member.name} is ${member.role} at Mardi Treks.</p>`,
        status: "published",
      },
      update: {
        name: member.name,
        role: member.role,
        image: member.image || null,
        bio: member.bio || undefined,
        status: "published",
      },
    });
  }

  invalidateCachePattern(cacheKeys.pattern.home);
  invalidateCachePattern(cacheKeys.pattern.treks);
  invalidateCachePattern(cacheKeys.pattern.site);
  invalidateCachePattern(cacheKeys.pattern.blog);
  invalidateCachePattern(cacheKeys.pattern.team);
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/blog");
  revalidatePath("/", "layout");
  revalidatePath("/admin/page-manager");
  redirect("/admin/page-manager");
}
