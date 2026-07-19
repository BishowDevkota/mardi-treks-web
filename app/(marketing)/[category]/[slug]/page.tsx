import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Star, ChevronDown, Search, X as XIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis";
import { TrekMapWrapper } from "@/components/map/TrekMapWrapper";
import { PricingCalculator } from "@/components/trek/PricingCalculator";
import { AltitudeProfile } from "@/components/trek/AltitudeProfile";
import { ReviewForm } from "@/components/trek/ReviewForm";
import { ContactFormSection } from "@/components/home/ContactFormSection";

async function getTrek(slug: string, categorySlug: string) {
  const cacheKey = cacheKeys.trek(`${categorySlug}:${slug}`);
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const trek = await prisma.trek.findUnique({
        where: { slug, status: "published" },
        include: {
          highlights: { orderBy: { sort: "asc" } },
          itinerary: { orderBy: { dayNumber: "asc" } },
          pricingTiers: true,
          availableDates: true,
          faqs: true,
          reviews: { where: { approved: true } },
          category: true,
          galleryImages: true,
        },
      });
      if (!trek) return null;
      if (trek.category?.slug !== categorySlug) return null;
      return trek;
    },
    120
  );
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category: catSlug, slug } = await params;
  const trek = await getTrek(slug, catSlug);
  if (!trek) return {};
  const title = trek.metaTitle || `${trek.title} | Mardi Treks`;
  const description = trek.metaDescription || trek.overview?.slice(0, 160);
  return { title, description, openGraph: { title, description, type: "article" } };
}

export const revalidate = 300;

function parseElevation(elevation: string): number {
  const parsed = parseFloat(elevation.replace(/[,m\s]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

function getMinPrice(tiers: any[]): number {
  if (!tiers || tiers.length === 0) return 0;
  return Math.min(...tiers.map((t: any) => t.pricePerPerson || 0));
}

function getMaxAltitude(itinerary: any[]): number {
  let max = 0;
  for (const day of itinerary) {
    if (day.elevation) {
      const val = parseElevation(day.elevation);
      if (val > max) max = val;
    }
  }
  return max;
}

function getAvgRating(reviews: any[]): number {
  if (!reviews.length) return 0;
  const approved = reviews.filter((r: any) => r.approved);
  if (!approved.length) return 0;
  return approved.reduce((a: number, r: any) => a + r.rating, 0) / approved.length;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category: catSlug, slug } = await params;
  const trek = await getTrek(slug, catSlug);
  if (!trek) notFound();

  // Normalize data
  const itinerary = trek.itinerary || [];
  const pricingTiers = trek.pricingTiers || [];
  const faqs = trek.faqs || [];
  const reviews = trek.reviews || [];
  const inclusions = (typeof trek.inclusions === "string" ? JSON.parse(trek.inclusions) : trek.inclusions) || [];
  const exclusions = (typeof trek.exclusions === "string" ? JSON.parse(trek.exclusions) : trek.exclusions) || [];
  const waypoints = (typeof trek.waypoints === "string" ? JSON.parse(trek.waypoints) : trek.waypoints) || [];
  const addons = (typeof trek.addons === "string" ? JSON.parse(trek.addons) : trek.addons) || [];
  const customSections = (typeof trek.customSections === "string" ? JSON.parse(trek.customSections) : trek.customSections) || [];
  const sectionData: Record<string, { heading?: string; description?: string }> =
    typeof (trek as any).sectionData === "string" ? JSON.parse((trek as any).sectionData) : {};

  const minPrice = getMinPrice(pricingTiers);
  const maxAltitude = trek.maxAltitude || getMaxAltitude(itinerary);
  const avgRating = getAvgRating(reviews);

  const difficultyColorMap: Record<string, { badge: string; dot: string }> = {
    easy: { badge: "bg-[#EEF3E8] text-[#4C6B45]", dot: "bg-[#6B8E5F]" },
    moderate: { badge: "bg-[#FBF0DE] text-[#9A6A1F]", dot: "bg-[#DB8A3A]" },
    challenging: { badge: "bg-[#FBE7DD] text-[#A24E2E]", dot: "bg-[#C25B36]" },
    difficult: { badge: "bg-[#F8DEDE] text-[#9C3939]", dot: "bg-[#B23F3F]" },
    extreme: { badge: "bg-[#EBE1F2] text-[#6B4C8A]", dot: "bg-[#7E5AA3]" },
  };

  return (
    <React.Fragment>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            name: trek.title,
            description: trek.overview?.slice(0, 200),
            price: trek.price,
            priceCurrency: "USD",
            duration: `P${trek.duration}D`,
            offers: {
              "@type": "Offer",
              price: trek.price,
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            },
            itinerary: itinerary?.map((day: any) => ({
              "@type": "Itinerary",
              name: `Day ${day.dayNumber}: ${day.title}`,
              description: day.description?.slice(0, 200),
            })),
          }),
        }}
      />

      {/* ================================================================
          HERO SECTION — Full-screen parallax with search
      ================================================================ */}
      <section className="relative flex h-screen w-full items-center overflow-hidden">
        {/* Background image with parallax */}
        <div
          className="hero-parallax absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: trek.heroImage
              ? `url(https://res.cloudinary.com/dk7ggjvlw/image/upload/${trek.heroImage})`
              : `url(https://images.unsplash.com/photo-1544735716-39742468007a)`,
          }}
        />
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(70, 55, 40, 0.45)", mixBlendMode: "multiply" as any }}
        />

        {/* Hero content — aligned with layout max-width */}
        <div className="relative z-10 w-full">
          <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-6">
            <div style={{ maxWidth: "800px" }}>
              <Link
                href={`/${catSlug}`}
                className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                ← Back to {trek.category?.name || "All"}
              </Link>
              <h1
                className="font-serif text-5xl leading-tight sm:text-6xl md:text-7xl"
                style={{ color: "#ffffff", marginBottom: "1.5rem" }}
              >
                {trek.title}
              </h1>
              <p
                className="mb-6 text-lg sm:text-xl"
                style={{ color: "#e0e0e0" }}
              >
                {trek.overview ? trek.overview.replace(/<[^>]*>/g, "").slice(0, 120) : "A journey through the heart of the Himalayas."}
              </p>

              {/* Breadcrumbs */}
              <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                <Link href="/" className="transition-colors hover:text-white">Home</Link>
                <span>/</span>
                <Link href={`/${catSlug}`} className="transition-colors hover:text-white">{trek.category?.name || "All"}</Link>
                <span>/</span>
                <span style={{ color: "#ffffff" }}>{trek.title}</span>
              </nav>

              {/* Search wrapper */}
              <div
                className="flex items-center rounded-full border px-5 py-4 backdrop-blur-md"
                style={{
                  maxWidth: "420px",
                  background: "rgba(255, 255, 255, 0.15)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <Search className="mr-3 h-5 w-5 shrink-0 text-white" />
                <input
                  type="text"
                  placeholder="Search other treks..."
                  className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/60"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          CONTENT WRAPPER
      ================================================================ */}
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* ── MAIN CONTENT ── */}
          <div className="space-y-0 lg:col-span-2">
            {/* ===========================================================
                OVERVIEW SECTION — Stats grid + description
            ============================================================ */}
            <section className="py-16 sm:py-20">
              <h2
                className="mb-10 text-3xl font-bold sm:text-4xl"
                style={{ color: "var(--color-secondary)" }}
              >
                Trip Overview
              </h2>

              {/* Stats Grid */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  className="rounded-3xl border p-6 text-center"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Duration
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {trek.duration} Days
                  </span>
                </div>

                <div
                  className="rounded-3xl border p-6 text-center"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Difficulty
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {trek.difficulty.charAt(0).toUpperCase() + trek.difficulty.slice(1)}
                  </span>
                </div>

                <div
                  className="rounded-3xl border p-6 text-center"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Max Altitude
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {maxAltitude > 0 ? `${maxAltitude.toLocaleString()}m` : "\u2014"}
                  </span>
                </div>

                <div
                  className="rounded-3xl border p-6 text-center"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Best Time
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {trek.bestTime || "\u2014"}
                  </span>
                </div>

                <div
                  className="rounded-3xl border p-6 text-center"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Min Price
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {minPrice > 0 ? `$${minPrice.toLocaleString()}` : "\u2014"}
                  </span>
                </div>

                <div
                  className="rounded-3xl border p-6 text-center"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span
                    className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Region
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--color-secondary)" }}
                  >
                    {trek.region || "\u2014"}
                  </span>
                </div>
              </div>

              {/* Overview description */}
              {trek.overview && (
                <div
                  className="max-w-3xl text-lg leading-relaxed"
                  style={{ color: "var(--color-text)" }}
                  dangerouslySetInnerHTML={{ __html: trek.overview }}
                />
              )}
            </section>

            {/* ===========================================================
                CUSTOM SECTIONS
            ============================================================ */}
            {customSections.map((cs: any, idx: number) => (
              <section key={cs.id || idx} className="py-16">
                <h2
                  className="mb-6 text-2xl font-bold"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {cs.data?.heading || "Custom Section"}
                </h2>
                {cs.data?.imageId && (
                  <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-xl">
                    <Image
                      src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/${cs.data.imageId}`}
                      alt={cs.data.imageAlt || cs.data?.heading || "Section image"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                  </div>
                )}
                {cs.data?.content && (
                  <div
                    className="text-lg leading-relaxed"
                    style={{ color: "var(--color-text)" }}
                    dangerouslySetInnerHTML={{ __html: cs.data.content }}
                  />
                )}
              </section>
            ))}

            {/* ===========================================================
                ITINERARY SECTION — Accordion style like template
            ============================================================ */}
            {itinerary.length > 0 && (
              <section id="itinerary" className="py-16">
                <h2
                  className="mb-2 text-2xl font-bold sm:text-3xl"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {sectionData.itinerary?.heading || "Itinerary"}
                </h2>
                {sectionData.itinerary?.description && (
                  <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>{sectionData.itinerary.description}</p>
                )}
                <div className="space-y-4">
                  {itinerary.map((day: any) => (
                    <details
                      key={day.dayNumber}
                      className="group cursor-pointer overflow-hidden rounded-3xl border transition-all duration-300"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <summary className="flex list-none items-center justify-between px-6 py-5 marker:content-none [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center gap-4">
                          <span
                            className="min-w-[70px] text-sm font-medium"
                            style={{ color: "var(--color-primary-light)" }}
                          >
                            Day {day.dayNumber}
                          </span>
                          <span
                            className="text-base font-semibold"
                            style={{ color: "var(--color-foreground)" }}
                          >
                            {day.title}
                          </span>
                        </div>
                        <ChevronDown
                          className="h-4 w-4 transition-transform duration-300 group-open:rotate-180"
                          style={{ color: "var(--color-secondary)" }}
                        />
                      </summary>
                      <div
                        className="border-t px-6 py-5"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
                          {day.description}
                        </p>
                        {(day.elevation || day.accommodation) && (
                          <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {day.elevation && <span>Elevation: {day.elevation}</span>}
                            {day.accommodation && <span>Accommodation: {day.accommodation}</span>}
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* ===========================================================
                ALTITUDE PROFILE
            ============================================================ */}
            {itinerary.length > 0 && (
              <section className="py-16">
                <AltitudeProfile itinerary={itinerary} />
              </section>
            )}

            {/* ===========================================================
                INCLUSIONS & EXCLUSIONS — Separate rows
            ============================================================ */}
            {(inclusions.length > 0 || exclusions.length > 0) && (
              <section className="py-16">
                <h2
                  className="mb-2 text-2xl font-bold"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {sectionData.inEx?.heading || "Inclusions & Exclusions"}
                </h2>
                {sectionData.inEx?.description && (
                  <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>{sectionData.inEx.description}</p>
                )}
                <div className="space-y-8">
                  {inclusions.length > 0 && (
                    <div>
                      <h3
                        className="mb-4 text-xl font-bold"
                        style={{ color: "var(--color-secondary)" }}
                      >
                        What&apos;s Included
                      </h3>
                      <ul className="space-y-3">
                        {inclusions.map((item: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 rounded-xl border p-4"
                            style={{
                              backgroundColor: "var(--color-surface-alt)",
                              borderColor: "var(--color-border)",
                            }}
                          >
                            <Check
                              className="mt-0.5 h-5 w-5 shrink-0"
                              style={{ color: "var(--color-success)" }}
                            />
                            <span className="text-sm" style={{ color: "var(--color-text)" }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exclusions.length > 0 && (
                    <div>
                      <h3
                        className="mb-4 text-xl font-bold"
                        style={{ color: "var(--color-secondary)" }}
                      >
                        What&apos;s Excluded
                      </h3>
                      <ul className="space-y-3">
                        {exclusions.map((item: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 rounded-xl border p-4"
                            style={{
                              backgroundColor: "var(--color-surface-alt)",
                              borderColor: "var(--color-border)",
                            }}
                          >
                            <XIcon
                              className="mt-0.5 h-5 w-5 shrink-0"
                              style={{ color: "var(--color-error)" }}
                            />
                            <span className="text-sm" style={{ color: "var(--color-text)" }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ===========================================================
                PRICING
            ============================================================ */}
            {pricingTiers.length > 0 && (
              <section id="pricing" className="py-16">
                <h2
                  className="mb-2 text-2xl font-bold"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {sectionData.pricing?.heading || "Pricing"}
                </h2>
                {sectionData.pricing?.description ? (
                  <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>{sectionData.pricing.description}</p>
                ) : (
                  <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>Per-person pricing based on group size.</p>
                )}
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "var(--color-surface-alt)" }}>
                        <th className="px-5 py-3 text-left font-semibold" style={{ color: "var(--color-secondary)" }}>Group Size</th>
                        <th className="px-5 py-3 text-right font-semibold" style={{ color: "var(--color-secondary)" }}>Price Per Person</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingTiers.map((tier: any, i: number) => (
                        <tr
                          key={i}
                          className="border-t"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          <td className="px-5 py-3" style={{ color: "var(--color-text)" }}>{tier.groupSize}</td>
                          <td className="px-5 py-3 text-right font-semibold" style={{ color: "var(--color-primary)" }}>
                            ${tier.pricePerPerson.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ===========================================================
                ADD-ONS
            ============================================================ */}
            {addons.length > 0 && (
              <section id="addons" className="py-16">
                <h2
                  className="mb-2 text-2xl font-bold"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {sectionData.addons?.heading || "Add-ons"}
                </h2>
                {sectionData.addons?.description ? (
                  <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>{sectionData.addons.description}</p>
                ) : (
                  <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>Optional extras to enhance your experience.</p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {addons.map((addon: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-2xl border p-5"
                      style={{
                        backgroundColor: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <h3 className="text-base font-semibold" style={{ color: "var(--color-secondary)" }}>
                        {addon.title}
                      </h3>
                      {addon.description && (
                        <p className="mt-1 text-sm" style={{ color: "var(--color-text)" }}>
                          {addon.description}
                        </p>
                      )}
                      <p className="mt-2 text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                        ${addon.pricePerUnit?.toLocaleString()} / {addon.unit === "room" ? "room" : "person"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ===========================================================
                MAP
            ============================================================ */}
            <section id="map" className="py-16">
              <h2
                className="mb-2 text-2xl font-bold"
                style={{ color: "var(--color-secondary)" }}
              >
                {sectionData.map?.heading || "Route Map"}
              </h2>
              {sectionData.map?.description ? (
                <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>{sectionData.map.description}</p>
              ) : (
                <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>Explore the terrain map showing the trek route.</p>
              )}
              <TrekMapWrapper
                geoJsonUrl={trek.geoJsonUrl || undefined}
                geoJsonData={trek.geoJsonData || null}
                waypoints={waypoints?.length > 0 ? waypoints : undefined}
                itinerary={itinerary?.length > 0 ? itinerary : undefined}
                staticFallbackImage={trek.staticMapImage || undefined}
              />
            </section>

            {/* ===========================================================
                FAQs
            ============================================================ */}
            {faqs.length > 0 && (
              <section className="py-16">
                <h2
                  className="mb-2 text-2xl font-bold"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {sectionData.faqs?.heading || "Frequently Asked Questions"}
                </h2>
                {sectionData.faqs?.description && (
                  <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>{sectionData.faqs.description}</p>
                )}
                <div className="space-y-3">
                  {faqs.map((faq: any, i: number) => (
                    <details
                      key={i}
                      className="group overflow-hidden rounded-2xl border"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {faq.question}
                        </span>
                        <ChevronDown
                          className="h-4 w-4 shrink-0 transition-transform duration-300 group-open:rotate-180"
                          style={{ color: "var(--color-text-muted)" }}
                        />
                      </summary>
                      <div
                        className="border-t px-5 py-4"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
                          {faq.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* ===========================================================
                REVIEWS
            ============================================================ */}
            <section className="py-16">
              <h2
                className="mb-6 text-2xl font-bold"
                style={{ color: "var(--color-secondary)" }}
              >
                Guest Reviews
              </h2>

              {avgRating > 0 && (
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5"
                        style={{
                          fill: i < Math.round(avgRating) ? "var(--color-warning)" : "var(--color-border)",
                          color: i < Math.round(avgRating) ? "var(--color-warning)" : "var(--color-border)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                    {avgRating.toFixed(1)} ({reviews.filter((r: any) => r.approved).length} reviews)
                  </span>
                </div>
              )}

              {reviews.filter((r: any) => r.approved).length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reviews
                    .filter((r: any) => r.approved)
                    .map((review: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-2xl border p-5"
                        style={{
                          backgroundColor: "var(--color-surface-alt)",
                          borderColor: "var(--color-border)",
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className="h-4 w-4"
                              style={{
                                fill: j < review.rating ? "var(--color-warning)" : "var(--color-border)",
                                color: j < review.rating ? "var(--color-warning)" : "var(--color-border)",
                              }}
                            />
                          ))}
                        </div>
                        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
                          {review.text}
                        </p>
                        <p className="mt-3 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                          — {review.author}
                        </p>
                      </div>
                    ))}
                </div>
              )}

              <div className="mt-8">
                <ReviewForm trekId={trek.id} />
              </div>
            </section>

            {/* ===========================================================
                GALLERY
            ============================================================ */}
            {trek.galleryImages?.length > 0 && (
              <section className="py-16">
                <h2
                  className="mb-2 text-2xl font-bold"
                  style={{ color: "var(--color-secondary)" }}
                >
                  {sectionData.gallery?.heading || "Gallery"}
                </h2>
                {sectionData.gallery?.description && (
                  <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>{sectionData.gallery.description}</p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {trek.galleryImages.map((img: any) => (
                    <div
                      key={img.id}
                      className="group relative overflow-hidden rounded-2xl"
                      style={{
                        backgroundColor: "var(--color-surface-alt)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/${img.imageId}`}
                          alt={img.alt || `${trek.title} trek photo`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                      {img.caption && (
                        <div className="px-3 py-2">
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {img.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ===========================================================
                CONTACT FORM
            ============================================================ */}
            <section className="py-16">
              <ContactFormSection
                heading={`Interested in ${trek.title}?`}
                description="Fill in your details below and we'll reach out with more information, availability, and a personalized quote."
              />
            </section>

            {/* ===========================================================
                GALLERY (end of main content column)
            ============================================================ */}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <PricingCalculator
                trekSlug={trek.slug}
                basePrice={trek.price}
                duration={trek.duration}
                pricingTiers={pricingTiers}
                addons={(typeof trek.addons === "string" ? JSON.parse(trek.addons) : trek.addons) || []}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero parallax animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: ".hero-parallax{animation:heroZoom 20s ease-out forwards}@keyframes heroZoom{0%{transform:scale(1)}100%{transform:scale(1.15)}}",
        }}
      />
    </React.Fragment>
  );
}
