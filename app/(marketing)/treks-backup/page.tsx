import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Mountain,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Trekking Packages",
  description:
    "Browse our curated selection of trekking and tour packages across Nepal. From Everest Base Camp to hidden Himalayan valleys.",
  openGraph: {
    title: "Trekking Packages | Mardi Treks",
    description:
      "Browse our curated selection of trekking and tour packages across Nepal.",
  },
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  moderate: "bg-yellow-100 text-yellow-700",
  challenging: "bg-orange-100 text-orange-700",
  difficult: "bg-red-100 text-red-700",
  extreme: "bg-purple-100 text-purple-700",
};

export const revalidate = 300;

export default async function TreksPage() {
  const allTreks = await prisma.trek.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
  });

  const regionCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};
  for (const t of allTreks) {
    regionCounts[t.region] = (regionCounts[t.region] || 0) + 1;
    difficultyCounts[t.difficulty] = (difficultyCounts[t.difficulty] || 0) + 1;
  }

  const regions = Object.entries(regionCounts).map(([value, count]) => ({
    value, label: value.charAt(0).toUpperCase() + value.slice(1), count,
  }));

  const difficulties = Object.entries(difficultyCounts).map(([value, count]) => ({
    value, label: value.charAt(0).toUpperCase() + value.slice(1), count,
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

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Trekking Packages
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {allTreks.length} treks across Nepal&apos;s most stunning regions
              </p>
            </div>
            {/* Sort & Search */}
            <div className="mt-4 flex items-center gap-3 sm:mt-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search treks..."
                  className="w-48 rounded-lg border border-slate-600 bg-slate-700/50 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <select className="rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
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

      {/* Main Content: Filter Sidebar + Grid */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* ===== FILTER SIDEBAR ===== */}
            <aside className="w-full shrink-0 lg:w-64">
              <div className="sticky top-24 space-y-6">
                {/* Active Filters — Mobile Toggle */}
                <div className="flex items-center justify-between lg:hidden">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
                    popoverTarget="filter-popover"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </button>
                  <span className="text-sm text-text-muted">{allTreks.length} results</span>
                </div>

                {/* Filter Content */}
                <div
                  id="filter-popover"
                  className="space-y-6 max-lg:hidden max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:overflow-y-auto max-lg:bg-white max-lg:p-6 [&:popover-open]:block max-lg:[&:popover-open]:flex max-lg:[&:popover-open]:flex-col"
                >
                  {/* Mobile close */}
                  <div className="flex items-center justify-between lg:hidden">
                    <h2 className="text-lg font-bold text-foreground">Filters</h2>
                    <button
                      className="p-1 text-text-muted hover:text-foreground"
                      popoverTarget="filter-popover"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Region Filter */}
                  <div>
                    <h3 className="flex items-center justify-between text-sm font-semibold text-foreground">
                      Region
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    </h3>
                    <div className="mt-3 space-y-2">
                      <Link
                        href="/treks"
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-alt"
                      >
                        <span>All Regions</span>
                        <span className="text-xs text-text-muted">{allTreks.length}</span>
                      </Link>
                      {regions.map((region) => (
                        <Link
                          key={region.value}
                          href={`/treks?region=${region.value}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-alt"
                        >
                          <span>{region.label}</span>
                          <span className="text-xs text-text-muted">{region.count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Difficulty Filter */}
                  <div>
                    <h3 className="flex items-center justify-between text-sm font-semibold text-foreground">
                      Difficulty
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    </h3>
                    <div className="mt-3 space-y-2">
                      {difficulties.map((d) => (
                        <Link
                          key={d.value}
                          href={`/treks?difficulty=${d.value}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-alt"
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
                          <span className="text-xs text-text-muted">{d.count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Duration Filter */}
                  <div>
                    <h3 className="flex items-center justify-between text-sm font-semibold text-foreground">
                      Duration
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    </h3>
                    <div className="mt-3 space-y-2">
                      {durations.map((d) => (
                        <Link
                          key={d.value}
                          href={`/treks?duration=${d.value}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-alt"
                        >
                          <span>{d.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Price Range Filter */}
                  <div>
                    <h3 className="flex items-center justify-between text-sm font-semibold text-foreground">
                      Price Range
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    </h3>
                    <div className="mt-3 space-y-2">
                      {priceRanges.map((p) => (
                        <Link
                          key={p.value}
                          href={`/treks?price=${p.value}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-alt"
                        >
                          <span>{p.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Clear Filters */}
                  <Link
                    href="/treks"
                    className="block rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-text-muted hover:bg-surface-alt"
                  >
                    Clear All Filters
                  </Link>
                </div>
              </div>
            </aside>

            {/* ===== TREK GRID ===== */}
            <div className="flex-1">
              {/* Results header (desktop) */}
              <div className="mb-6 hidden items-center justify-between lg:flex">
                <p className="text-sm text-text-muted">
                  Showing <span className="font-medium text-foreground">{allTreks.length}</span> treks
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {allTreks.map((trek) => (
                  <Link
                    key={trek.slug}
                    href={`/treks/${trek.slug}`}
                    className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-lg"
                  >
                    {/* Image placeholder */}
                    <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary-light/5">
                      <Mountain className="h-16 w-16 text-primary/30 group-hover:scale-110 group-hover:text-primary/50 transition-transform" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            difficultyColors[trek.difficulty] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {trek.difficulty.charAt(0).toUpperCase() + trek.difficulty.slice(1)}
                        </span>
                        <span className="text-xs font-medium text-text-muted">
                          {trek.duration} days
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {trek.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-text-muted">{trek.subtitle}</p>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-text-muted">{trek.region}</span>
                        <span className="text-base font-bold text-primary">
                          ${trek.price.toLocaleString()}
                          <span className="text-xs font-normal text-text-muted">/person</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Empty state */}
              {allTreks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Mountain className="h-16 w-16 text-text-muted/50" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">No treks found</h3>
                  <p className="mt-2 text-sm text-text-muted">
                    Try adjusting your filters to find more treks.
                  </p>
                  <Link
                    href="/treks"
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                  >
                    Clear Filters
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
