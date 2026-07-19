import { prisma } from "@/lib/prisma";
import { NavigationForm } from "./navigation-form";
import { Menu, Eye } from "lucide-react";
import Link from "next/link";

export default async function AdminNavigationPage() {
  const [settings, categories, allTreks] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { id: "site-settings" } }),
    prisma.category.findMany({
      orderBy: { sort: "asc" },
      select: {
        id: true, name: true, slug: true, icon: true,
        regions: { select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.trek.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        categoryId: true,
        status: true,
        duration: true,
        price: true,
      },
    }),
  ]);

  const currentLogo = settings?.logo || "";
  const currentTopBarContent = settings?.topBarContent || "";

  const currentNavigation = (() => {
    try {
      const nav = JSON.parse(settings?.navigation || "[]");
      return Array.isArray(nav) ? nav : [];
    } catch {
      return [];
    }
  })();

  const currentCategoryDropdownTreks: Record<string, string[]> = (() => {
    try {
      return JSON.parse(settings?.categoryDropdownTreks || "{}");
    } catch {
      return {};
    }
  })();

  // Group treks by category
  const treksByCategory = categories.map((cat) => ({
    ...cat,
    treks: allTreks.filter((t) => t.categoryId === cat.id && t.status === "published"),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Navigation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Customize the site navigation bar, logo, and which treks appear in category dropdowns.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-teal-600"
        >
          <Eye className="h-4 w-4" /> View Site
        </Link>
      </div>

      <NavigationForm
        logo={currentLogo}
        navigation={currentNavigation}
        categoryDropdownTreks={currentCategoryDropdownTreks}
        treksByCategory={JSON.parse(JSON.stringify(treksByCategory))}
        topBarContent={currentTopBarContent}
      />
    </div>
  );
}
