import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FallbackHero } from "@/components/home/FallbackHero";
import { FeaturedTreksSection } from "@/components/home/FeaturedTreksSection";
import { BestSellingTreks } from "@/components/home/BestSellingTreks";
import { TopRatedTreks } from "@/components/home/TopRatedTreks";
import { ReviewCarousel } from "@/components/home/ReviewCarousel";
import { StatsSection } from "@/components/home/StatsSection";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { LatestBlogPosts } from "@/components/home/LatestBlogPosts";
import { ContactFormSection } from "@/components/home/ContactFormSection";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: { canonical: "https://marditreks.com" },
  };
}

export default async function HomePage() {
  const settings = await getCachedOrFetch(
    cacheKeys.homeSettings,
    () => prisma.homePageSettings.findUnique({
      where: { id: "home-settings" },
    }),
    120
  );

  const featuredTrekIds: string[] = settings?.featuredTrekIds
    ? JSON.parse(settings.featuredTrekIds)
    : [];

  // Fetch featured treks for hero carousel
  let featuredTreksData: any[] = [];
  if (featuredTrekIds.length > 0) {
    featuredTreksData = await getCachedOrFetch(
      cacheKeys.featuredTreks,
      () => prisma.trek.findMany({
        where: { id: { in: featuredTrekIds }, status: "published" },
        include: {
          category: true,
          pricingTiers: true,
          reviews: { where: { approved: true } },
          itinerary: { orderBy: { dayNumber: "asc" } },
          _count: { select: { reviews: true } },
        },
      }),
      120
    );
    featuredTreksData.sort((a, b) => featuredTrekIds.indexOf(a.id) - featuredTrekIds.indexOf(b.id));
  }

  // Fetch featured section trek IDs (cards below hero)
  const featuredSectionIds: string[] = settings?.featuredSectionTrekIds
    ? JSON.parse(settings.featuredSectionTrekIds)
    : [];

  let featuredSectionTreks: any[] = [];
  if (featuredSectionIds.length > 0) {
    featuredSectionTreks = await getCachedOrFetch(
      cacheKeys.featuredSectionTreks,
      () => prisma.trek.findMany({
        where: { id: { in: featuredSectionIds }, status: "published" },
        include: {
          category: { select: { slug: true } },
          reviews: { where: { approved: true }, select: { rating: true } },
          _count: { select: { reviews: true } },
        },
      }),
      120
    );
    featuredSectionTreks.sort((a, b) => featuredSectionIds.indexOf(a.id) - featuredSectionIds.indexOf(b.id));
  }

  // Fetch all published treks for the search feature
  const allTreksForSearch = await getCachedOrFetch(
    cacheKeys.searchTreks,
    () => prisma.trek.findMany({
      where: { status: "published" },
      select: { title: true, slug: true, region: true, difficulty: true, duration: true, category: { select: { slug: true } } },
      orderBy: { title: "asc" },
    }),
    300
  );

  // Build hero content for the company slide
  const heroContent = settings
    ? {
        enabled: settings.heroEnabled ?? true,
        badge: settings.heroBadge ?? "",
        title: settings.heroTitle ?? "",
        titleHighlight: settings.heroTitleHighlight ?? "",
        subtitle: settings.heroSubtitle ?? "",
        description: settings.heroDescription ?? "",
        image: settings.heroImage ?? "",
      }
    : undefined;

  // Fetch latest approved reviews for the carousel
  const latestReviews = await getCachedOrFetch(
    cacheKeys.latestReviews,
    () => prisma.trekReview.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 9,
      include: { trek: { select: { title: true, slug: true } } },
    }),
    120
  );

  // Dynamic stats
  const totalTreks = await getCachedOrFetch(
    cacheKeys.stats + ":treks",
    () => prisma.trek.count({ where: { status: "published" } }),
    120
  );
  const totalReviews = await getCachedOrFetch(
    cacheKeys.stats + ":reviews",
    () => prisma.trekReview.count({ where: { approved: true } }),
    120
  );
  const totalBookings = await getCachedOrFetch(
    cacheKeys.stats + ":bookings",
    () => prisma.booking.count(),
    120
  );

  const dynamicStats = [
    { icon: "Mountain", value: `${totalTreks}+`, label: "Trek Packages" },
    { icon: "Users", value: `${totalBookings}+`, label: "Happy Trekkers" },
    { icon: "Map", value: "6", label: "Nepal Regions" },
    { icon: "Star", value: `${totalReviews}+`, label: "Guest Reviews" },
  ];

  // Section content from settings
  const s = settings as any;
  const featuredTreksHeading = s?.featuredTreksHeading;
  const featuredTreksDescription = s?.featuredTreksDescription;
  const bestSellingTreksHeading = s?.bestSellingTreksHeading;
  const bestSellingTreksDescription = s?.bestSellingTreksDescription;
  const topRatedTreksHeading = s?.topRatedTreksHeading;
  const topRatedTreksDescription = s?.topRatedTreksDescription;
  const reviewsHeading = s?.reviewsHeading;
  const reviewsDescription = s?.reviewsDescription;
  const blogHeading = s?.blogHeading;
  const blogDescription = s?.blogDescription;

  // Contact section
  const contactHeading = s?.contactHeading;
  const contactDescription = s?.contactDescription;
  const contactInfoCards: { title: string; description: string }[] = s?.contactInfoCards
    ? JSON.parse(s.contactInfoCards)
    : [];

  // Why Choose Us
  const whyChooseUsEnabled = s?.whyChooseUsEnabled ?? true;
  const whyChooseUsSubtitle = s?.whyChooseUsSubtitle;
  const whyChooseUsHeading = s?.whyChooseUsHeading;
  const whyChooseUsItems = s?.whyChooseUsItems
    ? JSON.parse(s.whyChooseUsItems)
    : null;
  const whyChooseUsBgImage = s?.whyChooseUsBgImage;

  return (
    <>
      {/* Hero */}
      {featuredTreksData.length > 0 ? (
        <HeroCarousel
          treks={JSON.parse(JSON.stringify(featuredTreksData))}
          heroContent={heroContent}
          allTreks={JSON.parse(JSON.stringify(allTreksForSearch))}
        />
      ) : (
        <FallbackHero />
      )}

      {/* Featured Treks */}
      <FeaturedTreksSection
        treks={JSON.parse(JSON.stringify(featuredSectionTreks))}
        heading={featuredTreksHeading}
        description={featuredTreksDescription}
      />

      {/* Why Choose Us */}
      {whyChooseUsEnabled && (
        <WhyChooseUs
          subtitle={whyChooseUsSubtitle}
          heading={whyChooseUsHeading}
          items={whyChooseUsItems}
          bgImage={whyChooseUsBgImage}
        />
      )}

      {/* Best Selling Treks */}
      <BestSellingTreks
        heading={bestSellingTreksHeading}
        description={bestSellingTreksDescription}
      />

      {/* Stats */}
      <StatsSection stats={dynamicStats} />

      {/* Top Rated Treks */}
      <TopRatedTreks
        heading={topRatedTreksHeading}
        description={topRatedTreksDescription}
      />

      {/* Reviews Carousel */}
      <ReviewCarousel
        reviews={JSON.parse(JSON.stringify(latestReviews))}
        heading={reviewsHeading}
        description={reviewsDescription}
      />

      {/* Latest Blog Posts */}
      <LatestBlogPosts
        heading={blogHeading}
        description={blogDescription}
      />

      {/* Contact Form */}
      <ContactFormSection
        heading={contactHeading}
        description={contactDescription}
        infoCards={contactInfoCards}
      />
    </>
  );
}
