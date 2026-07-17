import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar, Clock, Users, MapPin, Check, Mountain,
  X as XIcon, Star, ChevronDown, ArrowLeft,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TrekMapWrapper } from "@/components/map/TrekMapWrapper";
import { PricingCalculator } from "@/components/trek/PricingCalculator";
import { AltitudeProfile } from "@/components/trek/AltitudeProfile";
import { ReviewForm } from "@/components/trek/ReviewForm";

async function getTrek(slug: string, categorySlug: string) {
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
  // Validate the trek's category matches the URL segment
  if (trek.category?.slug !== categorySlug) return null;
  return trek;
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

export default async function ProductDetailPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category: catSlug, slug } = await params;
  const trek = await getTrek(slug, catSlug);
  if (!trek) notFound();

  // Normalize data
  const highlights = trek.highlights || [];
  const itinerary = trek.itinerary || [];
  const pricingTiers = trek.pricingTiers || [];
  const availableDates = trek.availableDates || [];
  const faqs = trek.faqs || [];
  const reviews = trek.reviews || [];
  const inclusions = (typeof trek.inclusions === "string" ? JSON.parse(trek.inclusions) : trek.inclusions) || [];
  const exclusions = (typeof trek.exclusions === "string" ? JSON.parse(trek.exclusions) : trek.exclusions) || [];
  const waypoints = (typeof trek.waypoints === "string" ? JSON.parse(trek.waypoints) : trek.waypoints) || [];
  const customSections = (typeof trek.customSections === "string" ? JSON.parse(trek.customSections) : trek.customSections) || [];

  const difficultyColorMap: Record<string, string> = {
    Easy: "bg-green-100 text-green-700", Moderate: "bg-yellow-100 text-yellow-700",
    Challenging: "bg-orange-100 text-orange-700", Difficult: "bg-red-100 text-red-700", Extreme: "bg-purple-100 text-purple-700",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "TouristTrip",
          name: trek.title, description: trek.overview?.slice(0, 200),
          price: trek.price, priceCurrency: "USD", duration: `P${trek.duration}D`,
          offers: { "@type": "Offer", price: trek.price, priceCurrency: "USD", availability: "https://schema.org/InStock" },
          itinerary: itinerary?.map((day: any) => ({ "@type": "Itinerary", name: `Day ${day.dayNumber}: ${day.title}`, description: day.description?.slice(0, 200) })),
        }),
      }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link href={`/${catSlug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to {trek.category?.name || "All"}
          </Link>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyColorMap[trek.difficulty] || "bg-slate-100 text-slate-700"}`}>{trek.difficulty}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">{trek.region} Region</span>
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">{trek.title}</h1>
              <p className="mt-3 text-xl text-slate-300">{trek.subtitle}</p>
              <div className="mt-6 flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-slate-300"><Clock className="h-5 w-5 text-teal-400" /><span>{trek.duration} Days</span></div>
                <div className="flex items-center gap-2 text-slate-300"><Users className="h-5 w-5 text-teal-400" /><span>Max {trek.maxGroupSize} people</span></div>
                <div className="flex items-center gap-2 text-slate-300"><MapPin className="h-5 w-5 text-teal-400" /><span>{trek.region} Region</span></div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-5 w-5 ${i < Math.floor(reviews?.[0]?.rating || 4.8) ? "fill-current text-amber-400" : "text-slate-500"}`} />))}</div>
                <span className="text-sm text-slate-300">{reviews?.length || 0} reviews</span>
              </div>
              <div className="mt-6"><span className="text-3xl font-bold text-white">${trek.price.toLocaleString()}</span><span className="ml-2 text-slate-300">/ person</span></div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={`/book/${trek.slug}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-teal-700">Book This Trek</Link>
                <Link href="#itinerary" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-500 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20">View Itinerary</Link>
              </div>
            </div>
            <div className="flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-400/10 p-12">
              <Mountain className="h-32 w-32 text-teal-400/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-0">
            <section><h2 className="text-2xl font-bold text-slate-900">Overview</h2><div dangerouslySetInnerHTML={{ __html: trek.overview || "" }} className="mt-4 text-lg leading-relaxed text-slate-600 prose max-w-none" /></section>

            {/* Custom sections */}
            {customSections.map((cs: any, idx: number) => (
              <div key={cs.id || idx}>
                <div className="relative my-16">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs font-medium text-slate-400">Custom</span>
                  </div>
                </div>
                <section>
                  <h2 className="text-2xl font-bold text-slate-900">{cs.data?.heading || "Custom Section"}</h2>
                  {cs.data?.imageId && (
                    <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl">
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
                    <div dangerouslySetInnerHTML={{ __html: cs.data.content }} className="mt-4 text-lg leading-relaxed text-slate-600 prose max-w-none" />
                  )}
                </section>
              </div>
            ))}

            {highlights.length > 0 && (
              <>
                <div className="relative my-16">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-2xl">⭐</span>
                  </div>
                </div>
                <section><h2 className="text-2xl font-bold text-slate-900">Trip Highlights</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{highlights.map((h: any, i: number) => (<div key={i} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"><span className="text-xl">{h.icon}</span><span className="text-sm text-slate-600">{h.text}</span></div>))}</div></section>
              </>
            )}

            {itinerary.length > 0 && (
              <>
                <div className="relative my-16">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-2xl">🗺️</span>
                  </div>
                </div>
                <section id="itinerary"><h2 className="text-2xl font-bold text-slate-900">Day-by-Day Itinerary</h2><div className="mt-6 space-y-4">{itinerary.map((day: any) => (<details key={day.dayNumber} className="group overflow-hidden rounded-lg border border-slate-200"><summary className="flex cursor-pointer items-center justify-between bg-slate-50 px-5 py-4 hover:bg-slate-100"><div><span className="text-sm font-medium text-teal-600">Day {day.dayNumber}</span><h3 className="mt-0.5 text-base font-semibold text-slate-900">{day.title}</h3></div><div className="flex items-center gap-4">{day.elevation && <span className="hidden text-xs text-slate-400 sm:block">{day.elevation}</span>}<ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" /></div></summary><div className="border-t border-slate-200 px-5 py-4"><p className="text-sm leading-relaxed text-slate-600">{day.description}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">{day.elevation && <span>Elevation: {day.elevation}</span>}{day.accommodation && <span>Accommodation: {day.accommodation}</span>}</div></div></details>))}</div></section>

                {/* Altitude Profile */}
                <div className="relative my-16">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-2xl">📈</span>
                  </div>
                </div>
                <section><AltitudeProfile itinerary={itinerary} /></section>
              </>
            )}

            <>
              <div className="relative my-16">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-2xl">📍</span>
                </div>
              </div>
              <section id="map"><h2 className="text-2xl font-bold text-slate-900">Route Map</h2><p className="mt-2 text-sm text-slate-400">Explore the terrain map showing the trek route.</p><div className="mt-4"><TrekMapWrapper geoJsonUrl={trek.geoJsonUrl || undefined} geoJsonData={trek.geoJsonData || null} waypoints={waypoints?.length > 0 ? waypoints : undefined} itinerary={itinerary?.length > 0 ? itinerary : undefined} staticFallbackImage={trek.staticMapImage || undefined} /></div></section>
            </>

            {/* Gallery */}
            {trek.galleryImages?.length > 0 && (
              <>
                <div className="relative my-16">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-2xl">🖼️</span>
                  </div>
                </div>
                <section>
                  <h2 className="text-2xl font-bold text-slate-900">Gallery</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {trek.galleryImages.map((img: any) => (
                      <div key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
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
                            <p className="text-xs text-slate-500">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            <>
              <div className="relative my-16">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-2xl">✅</span>
                </div>
              </div>
              <section className="grid gap-8 sm:grid-cols-2"><div><h2 className="text-xl font-bold text-slate-900">Inclusions</h2><ul className="mt-4 space-y-2">{inclusions?.map((item: string, i: number) => (<li key={i} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{item}</li>))}</ul></div><div><h2 className="text-xl font-bold text-slate-900">Exclusions</h2><ul className="mt-4 space-y-2">{exclusions?.map((item: string, i: number) => (<li key={i} className="flex items-start gap-2 text-sm text-slate-600"><XIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />{item}</li>))}</ul></div></section>
            </>

            {faqs.length > 0 && (
              <>
                <div className="relative my-16">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-2xl">❓</span>
                  </div>
                </div>
                <section><h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2><div className="mt-6 space-y-3">{faqs.map((faq: any, i: number) => (<details key={i} className="group overflow-hidden rounded-lg border border-slate-200"><summary className="flex cursor-pointer items-center justify-between bg-slate-50 px-5 py-4 hover:bg-slate-100"><span className="text-sm font-semibold text-slate-900">{faq.question}</span><ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" /></summary><div className="border-t border-slate-200 px-5 py-4"><p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p></div></details>))}</div></section>
              </>
            )}

            {/* Reviews Section — Guest Reviews + Write a Review */}
            <div className="relative my-16">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-2xl">💬</span>
              </div>
            </div>
            <section>
              <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
              {/* Existing reviews */}
              {reviews.filter((r: any) => r.approved).length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {reviews.filter((r: any) => r.approved).map((review: any, i: number) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`h-4 w-4 ${j < review.rating ? "fill-current text-amber-400" : "text-slate-300"}`} />
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.text}</p>
                      <p className="mt-3 text-xs font-medium text-slate-400">— {review.author}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Write a review form */}
              <div className="mt-8">
                <ReviewForm trekId={trek.id} />
              </div>
            </section>
          </div>

          {/* Sidebar */}
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
    </>
  );
}
