import { prisma } from "@/lib/prisma";
import { PageManagerForm } from "./page-manager-form";

export default async function PageManagerPage() {
  const [settings, treks, homeSettings] = await Promise.all([
    prisma.siteSetting.findUnique({
      where: { id: "site-settings" },
      select: { pageContent: true },
    }),
    prisma.trek.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { reviews: true } } },
    }),
    prisma.homePageSettings.findUnique({ where: { id: "home-settings" } }),
  ]);

  let pageContent: any = {};
  if (settings?.pageContent) {
    try { pageContent = JSON.parse(settings.pageContent); } catch {}
  }

  const hs = homeSettings as any;
  const initialFeaturedIds: string[] = hs?.featuredTrekIds
    ? JSON.parse(hs.featuredTrekIds)
    : [];
  const initialFeaturedSectionIds: string[] = hs?.featuredSectionTrekIds
    ? JSON.parse(hs.featuredSectionTrekIds)
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Page Manager</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage content for Home, About Us, Contact, Blog pages, and Footer.
        </p>
      </div>
      <PageManagerForm
        pageContent={pageContent}
        treks={JSON.parse(JSON.stringify(treks))}
        initialFeaturedIds={initialFeaturedIds}
        initialFeaturedSectionIds={initialFeaturedSectionIds}
      />
    </div>
  );
}
