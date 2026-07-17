"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Clock, MapPin, Star,
  TrendingUp, ArrowRight, Maximize2, X, Mountain, Loader2, Layers, Search,
  Users, Zap
} from "lucide-react";
import dynamic from "next/dynamic";

const MiniMap = dynamic(
  () => import("./MiniMap").then((m) => ({ default: m.MiniMap })),
  { ssr: false, loading: () => <div className="h-full w-full rounded-xl bg-secondary-dark/60 animate-pulse" /> }
);

const MiniAltitudeProfile = dynamic(
  () => import("./MiniAltitudeProfile").then((m) => ({ default: m.MiniAltitudeProfile })),
  { ssr: false, loading: () => <div className="h-full w-full rounded-xl bg-secondary-dark/60 animate-pulse" /> }
);

const FullScreenMap = dynamic(
  () => import("@/components/map/TrekMap").then((m) => ({ default: m.TrekMap })),
  { ssr: false, loading: () => (
    <div className="flex h-full items-center justify-center bg-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )}
);

const FullScreenAltitude = dynamic(
  () => import("@/components/trek/AltitudeProfile").then((m) => ({ default: m.AltitudeProfile })),
  { ssr: false, loading: () => (
    <div className="flex h-full items-center justify-center bg-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )}
);

interface HeroSlide {
  type: "company" | "trek";
  // Company slide
  company?: {
    badge?: string;
    title?: string;
    titleHighlight?: string;
    subtitle?: string;
    description?: string;
    image?: string;
  };
  // Trek slide
  trek?: FeaturedTrek;
}

interface FeaturedTrek {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  heroImage?: string | null;
  maxGroupSize?: number | null;
  duration: number;
  region: string;
  difficulty: string;
  price: number;
  category?: { slug: string } | null;
  pricingTiers?: Array<{ groupSize: string; pricePerPerson: number }>;
  reviews?: Array<{ rating: number }>;
  _count?: { reviews: number };
  geoJsonData?: string | null;
  geoJsonUrl?: string | null;
  waypoints?: string | null;
  centerLat?: number | null;
  centerLng?: number | null;
  zoom?: number | null;
  pitch?: number | null;
  itinerary?: Array<{
    dayNumber: number;
    title: string;
    Altitude?: string | null;
    description?: string | null;
    accommodation?: string | null;
  }>;
}

interface Props {
  treks: FeaturedTrek[];
  heroContent?: {
    enabled: boolean;
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    description: string;
    image: string;
  };
  allTreks?: Array<{
    title: string;
    slug: string;
    region: string;
    difficulty: string;
    duration: number;
    category?: { slug: string } | null;
  }>;
}

const AUTOPLAY_MS = 6000;

export function HeroCarousel({ treks, heroContent, allTreks }: Props) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fullscreenView, setFullscreenView] = useState<"map" | "altitude" | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  // Build slides array: company slide first, then trek slides
  const slides: HeroSlide[] = [];
  if (heroContent?.enabled) {
    slides.push({
      type: "company",
      company: {
        badge: heroContent.badge,
        title: heroContent.title,
        titleHighlight: heroContent.titleHighlight,
        subtitle: heroContent.subtitle,
        description: heroContent.description,
        image: heroContent.image,
      },
    });
  }
  treks.forEach((t) => slides.push({ type: "trek", trek: t }));

  const total = slides.length;
  const autoplayActive = total > 1 && !fullscreenView && !isPaused && !searchActive;

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const goNext = useCallback(() => {
    goTo((current + 1) % total);
  }, [current, total, goTo]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + total) % total);
  }, [current, total, goTo]);

  // Auto-play — paused while a fullscreen panel is open or the user is hovering the trail
  useEffect(() => {
    if (!autoplayActive) return;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [goNext, autoplayActive]);

  if (total === 0) return null;

  const slide = slides[current];

  // If it's a company slide, render company view with search
  if (slide.type === "company" && slide.company) {
    const c = slide.company;
    return (
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {c.image ? (
            <Image
              src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_1920,q_auto,f_auto/${c.image}`}
              alt=""
              fill
              className="object-cover scale-105"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Content — centered */}
        <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4 text-center sm:px-6">
          <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[4rem]">
            {c.title && <>{c.title} </>}
            {c.titleHighlight && (
              <span className="block text-primary">
                {c.titleHighlight}
              </span>
            )}
          </h1>
          {c.description && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
              {c.description}
            </p>
          )}

          {/* Search Bar */}
          <div className="mt-10 w-full max-w-xl">
            <SearchAutocomplete
              treks={allTreks || []}
              onSearchActiveChange={setSearchActive}
            />
          </div>
        </div>

        <CarouselNav
          total={total}
          current={current}
          goPrev={goPrev}
          goNext={goNext}
          goTo={goTo}
          autoplayActive={autoplayActive}
          setIsPaused={setIsPaused}
        />
      </section>
    );
  }

  // Trek slide
  const trek = slide.trek!;

  const avgRating = trek.reviews && trek.reviews.length > 0
    ? (trek.reviews.reduce((sum, r) => sum + r.rating, 0) / trek.reviews.length)
    : 0;
  const reviewCount = trek._count?.reviews || trek.reviews?.length || 0;
  const lowestPrice = trek.pricingTiers && trek.pricingTiers.length > 0
    ? Math.min(...trek.pricingTiers.map((t) => t.pricePerPerson))
    : trek.price;
  const categorySlug = trek.category?.slug || "treks";
  const waypoints = (() => {
    try { return trek.waypoints ? JSON.parse(trek.waypoints) : []; }
    catch { return []; }
  })();

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
      {/* Background image fills entire section */}
      <div className="absolute inset-0">
        {slides.map((s, i) => {
          const imgSrc = s.type === "trek" ? s.trek?.heroImage : s.company?.image;
          const altText = s.type === "trek" ? s.trek?.title || "" : "";
          return (
            <div key={s.type === "trek" ? s.trek!.id : "company"}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                i === current ? "opacity-100" : "opacity-0"
              }`}>
              {imgSrc ? (
                <Image
                  src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_1920,q_auto,f_auto/${imgSrc}`}
                  alt={altText}
                  fill
                  className="object-cover"
                  priority={i === 0}
                  sizes="100vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a]" />
              )}
              {/* Dark gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          );
        })}
      </div>

      {/* Content container */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-center px-6 sm:px-8 lg:px-10">
        <div className="flex h-full items-center gap-8">
          {/* LEFT SIDE — 55% */}
          <div className="w-[55%] pr-4">
            {/* Title */}
            <h1 className="text-[3.6rem] font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
              {trek.title}
            </h1>

            {trek.subtitle && (
              <p className="mt-3 text-xl font-medium text-white/80">{trek.subtitle}</p>
            )}

            {/* Trek info — bordered pills */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-primary" />
                {trek.duration} Days
              </span>
              {trek.category?.slug && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold capitalize text-white/90 backdrop-blur-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  {trek.category.slug}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold capitalize text-white/90 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-primary" />
                {trek.difficulty}
              </span>
              {avgRating > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-sm">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {avgRating.toFixed(1)}
                  <span className="text-white/50 font-normal">({reviewCount})</span>
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-12">
              <p className="text-sm uppercase tracking-[1px] text-white/80">Starting From</p>
              <h2 className="mt-1.5 text-[3.2rem] font-black text-white">${lowestPrice.toLocaleString()}</h2>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex items-center gap-4">
              <Link href={`/${categorySlug}/${trek.slug}`}
                className="rounded-xl bg-white px-7 py-4 text-base font-bold text-foreground shadow-md transition-all hover:bg-surface-alt hover:-translate-y-0.5">
                View Details
              </Link>
              <Link href={`/book/${trek.slug}`}
                className="rounded-xl bg-primary px-7 py-4 text-base font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-primary-dark hover:-translate-y-0.5">
                Book Now
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE — 45% */}
          <div className="w-[45%] flex flex-col gap-5">
            {/* Route Overview Card */}
{/* --- 1. Route Overview Module --- */}
<div className="group relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
  <div className="flex items-center justify-between px-6 py-4">
    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Route Overview</h3>
    <MapPin className="h-4 w-4 text-primary" />
  </div>

  <button onClick={() => setFullscreenView("map")} className="relative block h-[180px] w-full overflow-hidden px-4 pb-4">
    <div className="h-full w-full overflow-hidden rounded-xl transition-opacity group-hover:opacity-90">
      <MiniMap
        geoJsonUrl={trek.geoJsonUrl}
        geoJsonData={trek.geoJsonData}
        waypoints={waypoints}
        centerLat={trek.centerLat}
        centerLng={trek.centerLng}
        zoom={trek.zoom}
        lineColor="#ea580c"
        lineWidth={3}
      />
    </div>
    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
      <div className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform">
        <Maximize2 className="h-3.5 w-3.5" /> Detailed Map
      </div>
    </div>
  </button>
</div>

{/* --- 2. Altitude Profile Module --- */}
{trek.itinerary && trek.itinerary.length > 0 && (
  <div className="group relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
    <div className="flex items-center justify-between px-6 py-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Altitude Profile</h3>
      <Layers className="h-4 w-4 text-primary" />
    </div>

    <button onClick={() => setFullscreenView("altitude")} className="relative block h-[180px] w-full overflow-hidden px-4 pb-4">
      <div className="h-full w-full overflow-hidden rounded-xl transition-opacity group-hover:opacity-90">
        <MiniAltitudeProfile itinerary={trek.itinerary} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
        <div className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform">
          <Maximize2 className="h-3.5 w-3.5" /> Detailed Profile
        </div>
      </div>
    </button>
  </div>
)}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="relative h-[85vh] w-[90vw]">
            <button onClick={() => setFullscreenView(null)}
              className="absolute -top-11 right-0 z-10 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:text-white">
              <X className="h-4 w-4" /> Close
            </button>
            {fullscreenView === "map" ? (
              <div className="h-full w-full overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
                <FullScreenMap
                  geoJsonUrl={trek.geoJsonUrl || undefined}
                  geoJsonData={trek.geoJsonData}
                  waypoints={waypoints}
                  itinerary={trek.itinerary}
                  staticFallbackImage={trek.heroImage ? `https://res.cloudinary.com/dk7ggjvlw/image/upload/${trek.heroImage}` : undefined}
                />
              </div>
            ) : (
              <div className="h-full w-full overflow-auto rounded-2xl border border-white/20 bg-white p-6 shadow-2xl">
                <FullScreenAltitude itinerary={trek.itinerary || []} />
              </div>
            )}
          </div>
        </div>
      )}

      <CarouselNav
        total={total}
        current={current}
        goPrev={goPrev}
        goNext={goNext}
        goTo={goTo}
        autoplayActive={autoplayActive}
        setIsPaused={setIsPaused}
      />
    </section>
  );
}

/**
 * Shared bottom navigation: prev/next arrows plus a set of "trail" indicators.
 * Each indicator fills like a segment of trail being walked, giving a subtle,
 * on-theme sense of progress through the carousel. The fill animation runs
 * only while autoplay is active (i.e. not paused, not fullscreen).
 */
function CarouselNav({
  total, current, goPrev, goNext, goTo, autoplayActive, setIsPaused,
}: {
  total: number;
  current: number;
  goPrev: () => void;
  goNext: () => void;
  goTo: (i: number) => void;
  autoplayActive: boolean;
  setIsPaused: (v: boolean) => void;
}) {
  if (total <= 1) {
    return null;
  }

  return (
    <div
      className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-3">
        <button onClick={goPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.14]"
          aria-label="Previous slide">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative h-1.5 overflow-hidden rounded-full bg-white/20 transition-all duration-300 ${
                i === current ? "w-10" : "w-2.5 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            >
              {i === current && (
                <span
                  key={`${current}-${autoplayActive}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary-light"
                  style={{
                    animation: autoplayActive ? `trailFill ${AUTOPLAY_MS}ms linear forwards` : "none",
                    width: autoplayActive ? undefined : "100%",
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={goNext}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.14]"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <style jsx>{`
        @keyframes trailFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

/**
 * Search bar with autocomplete suggestions for trek names/regions.
 * - Clicking a suggestion navigates directly to the product page.
 * - Pressing Enter or clicking "Explore Now" goes to /search?q=...
 * - Pauses the carousel autoplay while the user is interacting with the search.
 */
function SearchAutocomplete({
  treks,
  onSearchActiveChange,
}: {
  treks: Props["allTreks"];
  onSearchActiveChange?: (active: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Notify parent about search activity for carousel pause
  const isActive = query.trim().length > 0 || focused;
  useEffect(() => {
    onSearchActiveChange?.(isActive);
  }, [isActive, onSearchActiveChange]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return (treks || []).filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, treks]);

  /** Navigate directly to the trek's product detail page */
  function goToProduct(trek: NonNullable<Props["allTreks"]>[number]) {
    const categorySlug = trek.category?.slug || "treks";
    router.push(`/${categorySlug}/${trek.slug}`);
  }

  /** Navigate to the search results page */
  function handleSearch(val: string) {
    if (!val.trim()) return;
    router.push(`/search?q=${encodeURIComponent(val.trim())}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        goToProduct(suggestions[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  }

  return (
    <div className="relative w-full" onMouseLeave={() => setSelectedIndex(-1)}>
      <div className="flex w-full items-center gap-0 overflow-hidden rounded-full border border-white/20 bg-white shadow-lg shadow-black/20 backdrop-blur-sm transition-all focus-within:border-primary/50 focus-within:shadow-primary/10">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Where do you want to go?"
          className="flex-1 border-none bg-transparent px-5 py-4 text-base text-foreground placeholder-text-muted outline-none"
        />
        <button
          type="button"
          onClick={() => handleSearch(query)}
          className="mr-1.5 flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
        >
          <Search className="h-4 w-4" />
          Explore Now
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {focused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          {suggestions.map((trek, i) => {
            const q = query.toLowerCase();
            const matchIdx = trek.title.toLowerCase().indexOf(q);
            const before = matchIdx > 0 ? trek.title.slice(0, matchIdx) : "";
            const match = matchIdx >= 0 ? trek.title.slice(matchIdx, matchIdx + q.length) : "";
            const after = matchIdx >= 0 ? trek.title.slice(matchIdx + q.length) : trek.title;

            return (
              <button
                key={trek.slug}
                type="button"
                onMouseDown={() => goToProduct(trek)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i === selectedIndex ? "bg-primary/10" : "hover:bg-surface-alt"
                }`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {before}<span className="bg-primary/20 text-primary font-semibold">{match}</span>{after}
                  </p>
                  <p className="text-xs text-text-muted">
                    {trek.region} · {trek.duration} days · {trek.difficulty}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}