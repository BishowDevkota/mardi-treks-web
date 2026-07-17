import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Mountain,
} from "lucide-react";

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  moderate: "bg-yellow-100 text-yellow-700",
  challenging: "bg-orange-100 text-orange-700",
  difficult: "bg-red-100 text-red-700",
  extreme: "bg-purple-100 text-purple-700",
};

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return { title: "Category Not Found" };

  return {
    title: cat.metaTitle || `${cat.name} | Mardi Treks`,
    description:
      cat.metaDescription ||
      `Browse our ${cat.name.toLowerCase()} packages across Nepal.`,
    openGraph: {
      title: cat.metaTitle || `${cat.name} | Mardi Treks`,
      description:
        cat.metaDescription ||
        `Browse our ${cat.name.toLowerCase()} packages across Nepal.`,
    },
  };
}

export default async function CategoryListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ region?: string; difficulty?: string; duration?: string; price?: string }>;
}) {
  const { category: catSlug } = await params;
  const filters = await searchParams;

  // Find the category
  const category = await prisma.category.findUnique({ where: { slug: catSlug } });
  if (!category) notFound();

  // Build where clause
  const where: any = { status: "published", categoryId: category.id };
  if (filters.region) where.region = filters.region;
  if (filters.difficulty) where.difficulty = filters.difficulty;
  if (filters.duration) {
    const [min, max] = filters.duration.split("-").map(Number);
    if (max) {
      where.duration = { gte: min, lte: max };
    } else {
      where.duration = { gte: min };
    }
  }
  if (filters.price) {
    const [min, max] = filters.price.split("-").map(Number);
    if (max) {
      where.price = { gte: min, lte: max };
    } else {
      where.price = { gte: min };
    }
  }

  const allTrekList = await prisma.trek.findMany({
    where: { status: "published", categoryId: category.id },
    orderBy: { createdAt: "desc" },
  });

  const filteredTreks = await prisma.trek.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      reviews: { where: { approved: true }, select: { rating: true } },
      availableDates: { select: { startDate: true, seatsLeft: true } },
    },
  });

  const regionCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};
  for (const t of allTrekList) {
    regionCounts[t.region] = (regionCounts[t.region] || 0) + 1;
    difficultyCounts[t.difficulty] = (difficultyCounts[t.difficulty] || 0) + 1;
  }

  const regions = Object.entries(regionCounts).map(([value, count]) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    count,
  }));

  const difficulties = Object.entries(difficultyCounts).map(([value, count]) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    count,
  }));

  const durations = [
    { value: "1-7", label: "1-7 Days" },
    { value: "8-12", label: "8-12 Days" },
    { value: "13-16", label: "13-16 Days" },
    { value: "17+", label: "17+ Days" },
  ];

  const priceRanges = [
    { value: "0-999", label: "Under $1,000" },
    { value: "1000-1499", label: "$1,000 - $1,499" },
    { value: "1500-1999", label: "$1,500 - $1,999" },
    { value: "2000+", label: "$2,000+" },
  ];

  const avgRating = (reviews: { rating: number }[]) => {
    if (!reviews.length) return null;
    return (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
  };

  const nextDate = (dates: { startDate: Date; seatsLeft: number }[]) => {
    const upcoming = dates.filter((d) => d.startDate > new Date());
    if (!upcoming.length) return null;
    const next = upcoming.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];
    return {
      date: next.startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      seatsLeft: next.seatsLeft,
    };
  };

  const buildFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (filters.region && key !== "region") params.set("region", filters.region);
    if (filters.difficulty && key !== "difficulty") params.set("difficulty", filters.difficulty);
    if (filters.duration && key !== "duration") params.set("duration", filters.duration);
    if (filters.price && key !== "price") params.set("price", filters.price);
    if (value) params.set(key, value);
    const qs = params.toString();
    return `/${catSlug}${qs ? `?${qs}` : ""}`;
  };

  const clearUrl = `/${catSlug}`;
  const hasActiveFilters = !!(filters.region || filters.difficulty || filters.duration || filters.price);

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {category.icon ? `${category.icon} ` : ""}
                {category.name}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {category.description || `${allTrekList.length} packages`}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3 sm:mt-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 rounded-lg border border-slate-600 bg-slate-700/50 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
              <select className="rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400">
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="duration">Duration</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* ===== FILTER SIDEBAR ===== */}
            <aside className="w-full shrink-0 lg:w-64">
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between lg:hidden">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    popoverTarget="filter-popover"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </button>
                  <span className="text-sm text-slate-500">{filteredTreks.length} results</span>
                </div>

                <div
                  id="filter-popover"
                  className="space-y-6 max-lg:hidden max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:overflow-y-auto max-lg:bg-white max-lg:p-6 [&:popover-open]:block max-lg:[&:popover-open]:flex max-lg:[&:popover-open]:flex-col"
                >
                  <div className="flex items-center justify-between lg:hidden">
                    <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                    <button
                      className="p-1 text-slate-500 hover:text-slate-900"
                      popoverTarget="filter-popover"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {hasActiveFilters && (
                    <Link
                      href={clearUrl}
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      <X className="h-3 w-3" /> Clear all filters
                    </Link>
                  )}

                  {/* Region */}
                  <div>
                    <h3 className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      Region <ChevronDown className="h-4 w-4 text-slate-400" />
                    </h3>
                    <div className="mt-3 space-y-2">
                      <Link
                        href={`/${catSlug}`}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50 ${
                          !filters.region ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-600"
                        }`}
                      >
                        <span>All Regions</span>
                        <span className="text-xs text-slate-400">{allTrekList.length}</span>
                      </Link>
                      {regions.map((region) => (
                        <Link
                          key={region.value}
                          href={buildFilterUrl("region", region.value)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50 ${
                            filters.region === region.value
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-slate-600"
                          }`}
                        >
                          <span>{region.label}</span>
                          <span className="text-xs text-slate-400">{region.count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Difficulty */}
                  <div>
                    <h3 className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      Difficulty <ChevronDown className="h-4 w-4 text-slate-400" />
                    </h3>
                    <div className="mt-3 space-y-2">
                      {difficulties.map((d) => (
                        <Link
                          key={d.value}
                          href={buildFilterUrl("difficulty", d.value)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50 ${
                            filters.difficulty === d.value
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-slate-600"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                d.value === "easy"
                                  ? "bg-green-500"
                                  : d.value === "moderate"
                                    ? "bg-yellow-500"
                                    : d.value === "challenging"
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                              }`}
                            />
                            {d.label}
                          </span>
                          <span className="text-xs text-slate-400">{d.count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Duration */}
                  <div>
                    <h3 className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      Duration <ChevronDown className="h-4 w-4 text-slate-400" />
                    </h3>
                    <div className="mt-3 space-y-2">
                      {durations.map((d) => (
                        <Link
                          key={d.value}
                          href={buildFilterUrl("duration", d.value)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50 ${
                            filters.duration === d.value
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-slate-600"
                          }`}
                        >
                          <span>{d.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Price Range */}
                  <div>
                    <h3 className="flex items-center justify-between text-sm font-semibold text-slate-900">
                      Price Range <ChevronDown className="h-4 w-4 text-slate-400" />
                    </h3>
                    <div className="mt-3 space-y-2">
                      {priceRanges.map((p) => (
                        <Link
                          key={p.value}
                          href={buildFilterUrl("price", p.value)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50 ${
                            filters.price === p.value
                              ? "bg-teal-50 text-teal-700 font-medium"
                              : "text-slate-600"
                          }`}
                        >
                          <span>{p.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* ===== TREK GRID ===== */}
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900">{filteredTreks.length}</span>{" "}
                  {filteredTreks.length === 1 ? "trek" : "treks"}
                </p>
              </div>

              {filteredTreks.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                    <MapPin className="h-6 w-6 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">No treks found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try adjusting your filters to see more results.
                  </p>
                  {hasActiveFilters && (
                    <Link
                      href={clearUrl}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-teal-700"
                    >
                      Clear Filters
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredTreks.map((trek) => {
                    const rating = avgRating(trek.reviews);
                    const next = nextDate(trek.availableDates);
                    return (
                      <Link
                        key={trek.id}
                        href={`/${catSlug}/${trek.slug}`}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                      >
                        {/* Hero Image / Placeholder */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-teal-100 to-teal-50">
                          {trek.heroImage ? (
                            <img
                              src={`https://res.cloudinary.com/demo/image/upload/w_600,h_338,c_fill/${trek.heroImage}`}
                              alt={trek.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Mountain className="h-12 w-12 text-teal-300" />
                            </div>
                          )}
                          {/* Badges */}
                          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                            {trek.heroBadge && (
                              <span className="rounded-full bg-gradient-to-r from-teal-500 to-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                                {trek.heroBadge}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                                difficultyColors[trek.difficulty] || "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {trek.difficulty.charAt(0).toUpperCase() + trek.difficulty.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                            {trek.title}
                          </h3>
                          {trek.subtitle && (
                            <p className="mt-0.5 text-xs text-slate-500">{trek.subtitle}</p>
                          )}

                          {/* Meta row */}
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {trek.duration} days
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{" "}
                              {trek.region.charAt(0).toUpperCase() + trek.region.slice(1)}
                            </span>
                            {rating && (
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating}
                              </span>
                            )}
                          </div>

                          {/* Next available date */}
                          {next && (
                            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5">
                              <Calendar className="h-3 w-3 text-teal-600" />
                              <span className="text-[11px] font-medium text-teal-700">
                                {next.date}{" "}
                                <span className="text-teal-500">
                                  ({next.seatsLeft} {next.seatsLeft === 1 ? "seat" : "seats"})
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Price */}
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-xs text-slate-400">Starting from</span>
                            <span className="text-lg font-bold text-teal-600">
                              ${trek.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
