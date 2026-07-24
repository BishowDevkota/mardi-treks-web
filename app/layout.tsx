import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { prisma } from "@/lib/prisma";
import { getCachedOrFetch, cacheKeys, CACHE_TTL } from "@/lib/redis";
import { sanitizeInlineHtml } from "@/lib/sanitize";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    default: "Mardi Treks | Premier Trekking & Tour Agency in Nepal",
    template: "%s | Mardi Treks",
  },
  description:
    "Experience the Himalayas with Mardi Treks. Expert-guided trekking and tour packages in Nepal, from Everest Base Camp to Annapurna Circuit.",
  keywords: [
    "trekking Nepal",
    "Nepal trekking",
    "Everest Base Camp",
    "Annapurna trek",
    "Himalaya tours",
    "Nepal travel",
    "trekking agency Nepal",
  ],
  openGraph: {
    title: "Mardi Treks | Premier Trekking & Tour Agency in Nepal",
    description:
      "Experience the Himalayas with Mardi Treks. Expert-guided trekking and tour packages in Nepal.",
    url: "https://marditreks.com",
    siteName: "Mardi Treks",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mardi Treks | Premier Trekking & Tour Agency in Nepal",
    description:
      "Experience the Himalayas with Mardi Treks. Expert-guided trekking and tour packages in Nepal.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  const categories = await getCachedOrFetch(
    cacheKeys.categories,
    () => prisma.category.findMany({
      where: { status: "published" },
      orderBy: { sort: "asc" },
      select: { id: true, name: true, slug: true, icon: true },
    }),
    CACHE_TTL.LAYOUT
  );

  const settingsData = await getCachedOrFetch(
    cacheKeys.siteSettings,
    () => prisma.siteSetting.findUnique({
      where: { id: "site-settings" },
      select: { logo: true, navigation: true, categoryDropdownTreks: true, topBarContent: true },
    }),
    CACHE_TTL.LAYOUT
  );

  const navigation = (() => {
    try {
      const nav = JSON.parse(settingsData?.navigation || "[]");
      return Array.isArray(nav) ? nav : [];
    } catch {
      return [];
    }
  })() as { label: string; href: string }[];

  const categoryDropdownTreks: Record<string, string[]> = (() => {
    try {
      return JSON.parse(settingsData?.categoryDropdownTreks || "{}");
    } catch {
      return {};
    }
  })();

  // Fetch treks that are selected for dropdowns, with region info
  const allSelectedTrekIds = Object.values(categoryDropdownTreks).flat();
  const dropdownTreks = allSelectedTrekIds.length > 0
    ? await getCachedOrFetch(
        cacheKeys.dropdownTreks,
        () => prisma.trek.findMany({
          where: { id: { in: allSelectedTrekIds }, status: "published" },
          select: {
            id: true, title: true, slug: true, categoryId: true,
            region: true,
            regionId: true,
            regionRef: { select: { id: true, name: true, slug: true } },
          },
        }),
        CACHE_TTL.LAYOUT
      )
    : [];

  // Also fetch all defined regions for categories to display region headers in dropdown
  const allRegions = await getCachedOrFetch(
    cacheKeys.allRegions,
    () => prisma.categoryRegion.findMany({
      select: { id: true, name: true, slug: true, categoryId: true },
      orderBy: { sortOrder: "asc" },
    }),
    CACHE_TTL.LAYOUT
  );

  return (
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
    >
      <body className="flex min-h-full flex-col">
        <SessionProvider>
          <Header
            categories={categories}
            siteLogo={settingsData?.logo || null}
            navigation={navigation}
            categoryDropdownTreks={categoryDropdownTreks}
            dropdownTreks={JSON.parse(JSON.stringify(dropdownTreks))}
            allRegions={JSON.parse(JSON.stringify(allRegions))}
            topBarContent={settingsData?.topBarContent ? sanitizeInlineHtml(settingsData.topBarContent) : null}
          />
          <main className="flex-1">{children}</main>
          <Footer />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
