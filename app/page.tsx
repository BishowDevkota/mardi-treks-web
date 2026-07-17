import { prisma } from "@/lib/prisma";
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

export default async function HomePage() {
  const settings = await prisma.homePageSettings.findUnique({
    where: { id: "home-settings" },
  });

  const featuredTrekIds: string[] = settings?.featuredTrekIds
    ? JSON.parse(settings.featuredTrekIds)
    : [];

  // Fetch featured treks for hero carousel
  let featuredTreksData: any[] = [];
  if (featuredTrekIds.length > 0) {
    featuredTreksData = await prisma.trek.findMany({
      where: { id: { in: featuredTrekIds }, status: "published" },
      include: {
        category: true,
        pricingTiers: true,
        reviews: { where: { approved: true } },
        itinerary: { orderBy: { dayNumber: "asc" } },
        _count: { select: { reviews: true } },
      },
    });
    featuredTreksData.sort((a, b) => featuredTrekIds.indexOf(a.id) - featuredTrekIds.indexOf(b.id));
  }

  // Fetch featured section trek IDs (cards below hero)
  const featuredSectionIds: string[] = settings?.featuredSectionTrekIds
    ? JSON.parse(settings.featuredSectionTrekIds)
    : [];

  let featuredSectionTreks: any[] = [];
  if (featuredSectionIds.length > 0) {
    featuredSectionTreks = await prisma.trek.findMany({
      where: { id: { in: featuredSectionIds }, status: "published" },
      include: {
        category: { select: { slug: true } },
        reviews: { where: { approved: true }, select: { rating: true } },
        _count: { select: { reviews: true } },
      },
    });
    featuredSectionTreks.sort((a, b) => featuredSectionIds.indexOf(a.id) - featuredSectionIds.indexOf(b.id));
  }

  // Fetch all published treks for the search feature
  const allTreksForSearch = await prisma.trek.findMany({
    where: { status: "published" },
    select: { title: true, slug: true, region: true, difficulty: true, duration: true, category: { select: { slug: true } } },
    orderBy: { title: "asc" },
  });

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
  const latestReviews = await prisma.trekReview.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 9,
    include: { trek: { select: { title: true, slug: true } } },
  });

  // Dynamic stats
  const totalTreks = await prisma.trek.count({ where: { status: "published" } });
  const totalReviews = await prisma.trekReview.count({ where: { approved: true } });
  const totalBookings = await prisma.booking.count();

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
      />
    </>
  );
}
