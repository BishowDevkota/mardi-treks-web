import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCachedOrFetch, cacheKeys, CACHE_TTL } from "@/lib/redis";
import { CategoryClient } from "./category-client";
import { SearchBar } from "@/components/search/SearchBar";
import { sanitizeRichText } from "@/lib/sanitize";
import {
  Star,
  SlidersHorizontal,
  X,
  ChevronDown,
  Calendar,
  Clock,
  Mountain,
} from "lucide-react";

const difficultyStyles: Record<string, { badge: string; dot: string }> = {
  easy: { badge: "bg-[#EEF3E8] text-[#4C6B45]", dot: "bg-[#6B8E5F]" },
  moderate: { badge: "bg-[#FBF0DE] text-[#9A6A1F]", dot: "bg-[#DB8A3A]" },
  challenging: { badge: "bg-[#FBE7DD] text-[#A24E2E]", dot: "bg-[#C25B36]" },
  difficult: { badge: "bg-[#F8DEDE] text-[#9C3939]", dot: "bg-[#B23F3F]" },
  extreme: { badge: "bg-[#EBE1F2] text-[#6B4C8A]", dot: "bg-[#7E5AA3]" },
};

// Extracted to module level to avoid React "Components created during render" error
function FilterSection({
  title,
  filterKey,
  isActive,
  children,
}: {
  title: string;
  filterKey: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group" open={isActive}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 marker:content-none [&::-webkit-details-marker]:hidden">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted group-open:text-secondary">
          {title}
        </h3>
        <ChevronDown className="h-4 w-4 text-text-muted transition-transform duration-200 group-open:rotate-180 group-open:text-primary" />
      </summary>
      <div className="mt-3 space-y-1 pb-1">{children}</div>
    </details>
  );
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = await getCachedOrFetch(
    cacheKeys.categoryBySlug(slug),
    () => prisma.category.findUnique({ where: { slug } }),
    CACHE_TTL.LAYOUT
  );
  if (!cat) {
    const page = await getCachedOrFetch(
      cacheKeys.pageBySlug(slug),
      () => prisma.page.findFirst({ where: { slug, status: "published" } }),
      CACHE_TTL.PAGE_CONTENT
    );
    if (!page) return { title: "Page Not Found" };

    return {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      alternates: { canonical: `https://marditreks.com/${page.slug}` },
      openGraph: {
        title: page.metaTitle || page.title,
        description: page.metaDescription || undefined,
        url: `https://marditreks.com/${page.slug}`,
        images: page.ogImage ? [page.ogImage] : undefined,
      },
    };
  }

  return {
    title: cat.metaTitle || `${cat.name} | Mardi Treks`,
    description:
      cat.metaDescription ||
      `Browse our ${cat.name.toLowerCase()} packages across Nepal.`,
    alternates: { canonical: `https://marditreks.com/${slug}` },
    openGraph: {
      title: cat.metaTitle || `${cat.name} | Mardi Treks`,
      description:
        cat.metaDescription ||
        `Browse our ${cat.name.toLowerCase()} packages across Nepal.`,
      url: `https://marditreks.com/${slug}`,
    },
  };
}

export default async function CategoryListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    region?: string;
    difficulty?: string;
    duration?: string;
    price?: string;
    rating?: string;
    q?: string;
  }>;
}) {
  const { category: catSlug } = await params;
  const filters = await searchParams;

  const category = await getCachedOrFetch(
    cacheKeys.categoryBySlug(catSlug),
    () => prisma.category.findUnique({ where: { slug: catSlug } }),
    CACHE_TTL.LAYOUT
  );
  if (!category) {
    const page = await getCachedOrFetch(
      cacheKeys.pageBySlug(catSlug),
      () => prisma.page.findFirst({ where: { slug: catSlug, status: "published" } }),
      CACHE_TTL.PAGE_CONTENT
    );
    if (!page) notFound();

    const [latestPosts, homeSettings, allTreksForSearch] = await Promise.all([
      getCachedOrFetch(
        cacheKeys.blogPosts,
        () => prisma.blogPost.findMany({
          where: { status: "published" },
          orderBy: { publishedDate: "desc" },
          take: 3,
          select: {
            slug: true,
            title: true,
            excerpt: true,
            publishedDate: true,
            heroImage: true,
          },
        }),
        CACHE_TTL.MODERATE
      ),
      prisma.homePageSettings.findUnique({
        where: { id: "home-settings" },
        select: { featuredSectionTrekIds: true },
      }),
      getCachedOrFetch(
        cacheKeys.searchTreks,
        () => prisma.trek.findMany({
          where: { status: "published" },
          select: {
            title: true,
            slug: true,
            region: true,
            difficulty: true,
            duration: true,
            category: { select: { slug: true } },
          },
          orderBy: { title: "asc" },
        }),
        CACHE_TTL.MODERATE
      ),
    ]);

    const featuredIds: string[] = (() => {
      try {
        const parsed = JSON.parse(homeSettings?.featuredSectionTrekIds || "[]");
        return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
      } catch {
        return [];
      }
    })();

    const featuredTreks = await prisma.trek.findMany({
      where: featuredIds.length
        ? { id: { in: featuredIds }, status: "published" }
        : { status: "published" },
      take: 3,
      orderBy: featuredIds.length ? undefined : { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        heroImage: true,
        duration: true,
        category: { select: { slug: true } },
      },
    });
    featuredTreks.sort((a, b) => featuredIds.indexOf(a.id) - featuredIds.indexOf(b.id));

    const heroImageUrl = page.heroImage
      ? `https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_1600,q_auto,f_auto/${page.heroImage}`
      : null;

    return (
      <>
        <section className="relative isolate flex min-h-[clamp(460px,72vh,760px)] flex-col overflow-hidden">
          {heroImageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImageUrl})`, transform: "scale(1.02)" }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-dark via-primary-dark/20 to-gray-900" />
          )}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/5 via-black/35 to-black/90" />
          <div className="relative z-10 mt-auto w-full">
            <div className="mx-auto max-w-screen-2xl px-4 pb-[clamp(48px,7vw,84px)] sm:px-6 lg:px-8">
              <h1 className="max-w-4xl text-[clamp(36px,5.5vw,64px)] font-bold leading-[1.06] tracking-tight text-white">
                {page.title}
              </h1>
              {page.heroDescription && (
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                  {page.heroDescription}
                </p>
              )}
              <nav aria-label="Breadcrumb" className="mb-3 mt-7 flex items-center gap-2 text-sm text-white/60">
                <Link href="/" className="hover:text-white">Home</Link>
                <span>/</span>
                <span className="truncate text-white/85">{page.title}</span>
              </nav>
              <div className="w-full max-w-xl">
                <SearchBar treks={allTreksForSearch} />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-2xl px-4 py-12 pb-24 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <article
              className="prose-custom rich-text lg:col-span-2"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }}
            />

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {latestPosts.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                  <div className="border-b border-border bg-surface-alt px-5 py-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
                      Latest Articles
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {latestPosts.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="group flex gap-3 px-5 py-4 transition-colors hover:bg-surface-alt"
                      >
                        {post.heroImage ? (
                          <Image
                            src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_160,h_120,q_auto,f_auto/${post.heroImage}`}
                            alt=""
                            width={80}
                            height={64}
                            className="h-16 w-20 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Mountain className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                            {post.title}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-text-muted">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.publishedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {featuredTreks.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                  <div className="border-b border-border bg-surface-alt px-5 py-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
                      Featured Treks
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {featuredTreks.map((trek) => (
                      <Link
                        key={trek.id}
                        href={`/${trek.category?.slug || "treks"}/${trek.slug}`}
                        className="group flex gap-3 px-5 py-4 transition-colors hover:bg-surface-alt"
                      >
                        {trek.heroImage ? (
                          <Image
                            src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_160,h_120,q_auto,f_auto/${trek.heroImage}`}
                            alt=""
                            width={80}
                            height={64}
                            className="h-16 w-20 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Mountain className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                            {trek.title}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-text-muted">
                            <Clock className="h-3 w-3" />
                            {trek.duration} days
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </>
    );
  }

  const where: any = { status: "published", categoryId: category.id };
  if (filters.region) where.region = filters.region;
  if (filters.difficulty) where.difficulty = filters.difficulty;
  if (filters.duration) {
    const [min, max] = filters.duration.split("-").map(Number);
    where.duration = max ? { gte: min, lte: max } : { gte: min };
  }
  if (filters.price) {
    const [min, max] = filters.price.split("-").map(Number);
    where.price = max ? { gte: min, lte: max } : { gte: min };
  }
  if (filters.q) {
    where.title = { contains: filters.q, mode: "insensitive" };
  }

  const allTrekList = await getCachedOrFetch(
    cacheKeys.categoryTreksAll(category.id),
    () => prisma.trek.findMany({
      where: { status: "published", categoryId: category.id },
      orderBy: { createdAt: "desc" },
    }),
    CACHE_TTL.MODERATE
  );

  const allTreksForSearch = await getCachedOrFetch(
    cacheKeys.searchTreks,
    () => prisma.trek.findMany({
      where: { status: "published" },
      select: {
        title: true,
        slug: true,
        region: true,
        difficulty: true,
        duration: true,
        category: { select: { slug: true } },
      },
      orderBy: { title: "asc" },
    }),
    CACHE_TTL.MODERATE
  );

  const filteredTreksRaw = await prisma.trek.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      reviews: { where: { approved: true }, select: { rating: true } },
    },
  });

  const avgRating = (reviews: { rating: number }[]) => {
    if (!reviews.length) return null;
    return reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  };

  const minRating = filters.rating ? Number(filters.rating) : null;
  const filteredTreks = minRating
    ? filteredTreksRaw.filter((t) => {
        const avg = avgRating(t.reviews);
        return avg !== null && avg >= minRating;
      })
    : filteredTreksRaw;

  const regionCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};
  for (const t of allTrekList) {
    if (t.region) regionCounts[t.region] = (regionCounts[t.region] || 0) + 1;
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
    { value: "1000-1499", label: "$1,000 – $1,499" },
    { value: "1500-1999", label: "$1,500 – $1,999" },
    { value: "2000+", label: "$2,000+" },
  ];

  const ratingOptions = [
    { value: "5", label: "5 stars" },
    { value: "4", label: "4 stars & up" },
    { value: "3", label: "3 stars & up" },
    { value: "2", label: "2 stars & up" },
    { value: "1", label: "1 star & up" },
  ];

  const buildFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      region: filters.region,
      difficulty: filters.difficulty,
      duration: filters.duration,
      price: filters.price,
      rating: filters.rating,
      q: filters.q,
    };
    for (const [k, v] of Object.entries(current)) {
      if (v && k !== key) params.set(k, v);
    }
    if (value) params.set(key, value);
    const qs = params.toString();
    return `/${catSlug}${qs ? `?${qs}` : ""}`;
  };

  const clearUrl = `/${catSlug}`;
  const hasActiveFilters = !!(
    filters.region ||
    filters.difficulty ||
    filters.duration ||
    filters.price ||
    filters.rating
  );

  const activeChips: { key: string; label: string }[] = [];
  if (filters.region) activeChips.push({ key: "region", label: filters.region.charAt(0).toUpperCase() + filters.region.slice(1) });
  if (filters.difficulty) activeChips.push({ key: "difficulty", label: filters.difficulty.charAt(0).toUpperCase() + filters.difficulty.slice(1) });
  if (filters.duration) activeChips.push({ key: "duration", label: durations.find((d) => d.value === filters.duration)?.label ?? filters.duration });
  if (filters.price) activeChips.push({ key: "price", label: priceRanges.find((p) => p.value === filters.price)?.label ?? filters.price });
  if (filters.rating) activeChips.push({ key: "rating", label: ratingOptions.find((r) => r.value === filters.rating)?.label ?? `${filters.rating}★ & up` });

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="border-b border-border bg-background py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {category.name}
          </h1>
          <nav aria-label="Breadcrumb" className="mb-3 mt-6 flex items-center justify-center gap-2 text-sm text-text-muted">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
          <div className="mx-auto max-w-xl">
            <SearchBar treks={allTreksForSearch} />
          </div>
        </div>
      </section>

      {/* ===== Main Content ===== */}
      <section className="bg-background py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Filtering by:</span>
              {activeChips.map((chip) => (
                <Link
                  key={chip.key}
                  href={buildFilterUrl(chip.key, "")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </Link>
              ))}
              <Link href={clearUrl} className="text-xs font-medium text-text-muted underline decoration-dotted underline-offset-2 hover:text-foreground">
                Clear all
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* ===== FILTER SIDEBAR ===== */}
            <aside className="w-full shrink-0 lg:w-72">
              <div className="sticky top-24 space-y-5">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 lg:hidden">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                    popoverTarget="filter-popover"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    Filters
                  </button>
                  <span className="text-sm text-text-muted">{filteredTreks.length} results</span>
                </div>

                <div
                  id="filter-popover"
                  className="divide-y divide-border rounded-3xl border border-border bg-surface px-5 shadow-sm max-lg:hidden max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:overflow-y-auto max-lg:rounded-none max-lg:border-0 max-lg:p-6 [&:popover-open]:block max-lg:[&:popover-open]:flex max-lg:[&:popover-open]:flex-col"
                >
                  <div className="flex items-center justify-between py-4 lg:hidden">
                    <h2 className="text-lg font-semibold text-foreground">Filters</h2>
                    <button className="p-1 text-text-muted hover:text-foreground" popoverTarget="filter-popover">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="hidden items-center gap-2 py-4 lg:flex">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-secondary">Refine Results</h2>
                  </div>

                  <div className="py-4">
                    <FilterSection title="Region" filterKey="region" isActive={!!filters.region}>
<Link href={buildFilterUrl("region", "")}
  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${!filters.region ? "bg-primary text-white font-medium" : "text-text hover:bg-surface-alt"}`}>
  <span>All Regions</span>
  <span className={`text-xs ${!filters.region ? "text-white/70" : "text-text-muted"}`}>{allTrekList.length}</span>
</Link>
                      {regions.map((region) => (
                        <Link key={region.value} href={buildFilterUrl("region", region.value)}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${filters.region === region.value ? "bg-primary text-white font-medium" : "text-text hover:bg-surface-alt"}`}>
                          <span>{region.label}</span>
                          <span className={`text-xs ${filters.region === region.value ? "text-white/70" : "text-text-muted"}`}>{region.count}</span>
                        </Link>
                      ))}
                    </FilterSection>
                  </div>

                  <div className="py-4">
                    <FilterSection title="Difficulty" filterKey="difficulty" isActive={!!filters.difficulty}>
                      {difficulties.map((d) => (
                        <Link key={d.value} href={buildFilterUrl("difficulty", d.value)}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${filters.difficulty === d.value ? "bg-primary/10 text-primary font-medium" : "text-text hover:bg-surface-alt"}`}>
                          <span className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${difficultyStyles[d.value]?.dot ?? "bg-secondary-light"}`} />
                            {d.label}
                          </span>
                          <span className="text-xs text-text-muted">{d.count}</span>
                        </Link>
                      ))}
                    </FilterSection>
                  </div>

                  <div className="py-4">
                    <FilterSection title="Duration" filterKey="duration" isActive={!!filters.duration}>
                      {durations.map((d) => (
                        <Link key={d.value} href={buildFilterUrl("duration", d.value)}
                          className={`flex items-center rounded-xl px-3 py-2 text-sm transition ${filters.duration === d.value ? "bg-primary text-white font-medium" : "text-text hover:bg-surface-alt"}`}>
                          {d.label}
                        </Link>
                      ))}
                    </FilterSection>
                  </div>

                  <div className="py-4">
                    <FilterSection title="Price Range" filterKey="price" isActive={!!filters.price}>
                      {priceRanges.map((p) => (
                        <Link key={p.value} href={buildFilterUrl("price", p.value)}
                          className={`flex items-center rounded-xl px-3 py-2 text-sm transition ${filters.price === p.value ? "bg-primary text-white font-medium" : "text-text hover:bg-surface-alt"}`}>
                          {p.label}
                        </Link>
                      ))}
                    </FilterSection>
                  </div>

                  <div className="py-4">
                    <FilterSection title="Review Rating" filterKey="rating" isActive={!!filters.rating}>
                      {ratingOptions.map((r) => (
                        <Link key={r.value} href={buildFilterUrl("rating", r.value)}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${filters.rating === r.value ? "bg-primary/10 text-primary font-medium" : "text-text hover:bg-surface-alt"}`}>
                          <span className="flex items-center gap-1">
                            {Array.from({ length: Number(r.value) }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                            ))}
                          </span>
                          <span className="text-xs">{r.label}</span>
                        </Link>
                      ))}
                    </FilterSection>
                  </div>

                  {hasActiveFilters && (
                    <div className="py-4">
                      <Link href={clearUrl} className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold text-text-muted transition hover:bg-surface-alt hover:text-foreground">
                        <X className="h-3 w-3" /> Clear all filters
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* ===== TREK GRID (client-side search) ===== */}
            <div className="flex-1">
              <CategoryClient
                catSlug={catSlug}
                categoryName={category.name}
                treks={JSON.parse(JSON.stringify(filteredTreks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  slug: t.slug,
                  heroImage: t.heroImage,
                  difficulty: t.difficulty,
                  duration: t.duration,
                  price: t.price,
                  avgRating: (() => {
                    const avg = avgRating(t.reviews);
                    return avg !== null ? Math.round(avg * 10) / 10 : null;
                  })(),
                }))))}
                hasActiveFilters={hasActiveFilters}
                clearUrl={clearUrl}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
