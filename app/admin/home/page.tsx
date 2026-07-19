import { prisma } from "@/lib/prisma";
import { HomeForm } from "./home-form";
import { Home, Mountain, Eye } from "lucide-react";
import Link from "next/link";

export default async function AdminHomePage() {
  const [treks, settings] = await Promise.all([
    prisma.trek.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { reviews: true } } },
    }),
    prisma.homePageSettings.findUnique({ where: { id: "home-settings" } }),
  ]);

  const initialFeaturedIds: string[] = settings?.featuredTrekIds
    ? JSON.parse(settings.featuredTrekIds)
    : [];

  const initialFeaturedSectionIds: string[] = settings?.featuredSectionTrekIds
    ? JSON.parse(settings.featuredSectionTrekIds)
    : [];

  const s = settings as any;

  const heroContent = {
    heroEnabled: s?.heroEnabled ?? true,
    heroBadge: s?.heroBadge ?? "",
    heroTitle: s?.heroTitle ?? "",
    heroTitleHighlight: s?.heroTitleHighlight ?? "",
    heroSubtitle: s?.heroSubtitle ?? "",
    heroDescription: s?.heroDescription ?? "",
    heroImage: s?.heroImage ?? "",
  };

  // Contact section
  const contactInfoCards: { title: string; description: string }[] = s?.contactInfoCards
    ? JSON.parse(s.contactInfoCards)
    : [];

  const contactContent = {
    contactHeading: s?.contactHeading ?? "",
    contactDescription: s?.contactDescription ?? "",
    contactInfoCards,
  };

  // Section content
  const sectionContent = {
    featuredTreksHeading: s?.featuredTreksHeading ?? "",
    featuredTreksDescription: s?.featuredTreksDescription ?? "",
    bestSellingTreksHeading: s?.bestSellingTreksHeading ?? "",
    bestSellingTreksDescription: s?.bestSellingTreksDescription ?? "",
    topRatedTreksHeading: s?.topRatedTreksHeading ?? "",
    topRatedTreksDescription: s?.topRatedTreksDescription ?? "",
    reviewsHeading: s?.reviewsHeading ?? "",
    reviewsDescription: s?.reviewsDescription ?? "",
    blogHeading: s?.blogHeading ?? "",
    blogDescription: s?.blogDescription ?? "",
  };

  // Why Choose Us
  const whyChooseUsItems: { icon: string; title: string; description: string }[] =
    s?.whyChooseUsItems ? JSON.parse(s.whyChooseUsItems) : [];

  const whyChooseUsContent = {
    whyChooseUsEnabled: s?.whyChooseUsEnabled ?? true,
    whyChooseUsSubtitle: s?.whyChooseUsSubtitle ?? "",
    whyChooseUsHeading: s?.whyChooseUsHeading ?? "",
    whyChooseUsItems,
    whyChooseUsBgImage: s?.whyChooseUsBgImage ?? "",
  };

  const publishedCount = treks.filter((t) => t.status === "published").length;
  const featuredCount = initialFeaturedIds.length;
  const featuredSectionCount = initialFeaturedSectionIds.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Home Page</h1>
          <p className="mt-1 text-sm text-slate-500">
            Customize every section of your homepage
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-teal-600"
        >
          <Eye className="h-4 w-4" /> View Home Page
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2">
              <Mountain className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{treks.length}</p>
              <p className="text-xs text-slate-500">Total Treks</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <Eye className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{publishedCount}</p>
              <p className="text-xs text-slate-500">Published Treks</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2">
              <Eye className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{featuredCount}</p>
              <p className="text-xs text-slate-500">In Carousel</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2">
              <Home className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{featuredSectionCount}</p>
              <p className="text-xs text-slate-500">Featured Section</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <HomeForm
        treks={JSON.parse(JSON.stringify(treks))}
        initialFeaturedIds={initialFeaturedIds}
        initialFeaturedSectionIds={initialFeaturedSectionIds}
        heroContent={heroContent}
        sectionContent={sectionContent}
        whyChooseUsContent={whyChooseUsContent}
        contactContent={contactContent}
      />
    </div>
  );
}
