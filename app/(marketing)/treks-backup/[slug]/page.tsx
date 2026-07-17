import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Check,
  Mountain,
  X as XIcon,
  Star,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TrekMapWrapper } from "@/components/map/TrekMapWrapper";

// ── Fetch trek from database ─────────────────────────────────────────
async function getTrek(slug: string) {
  return prisma.trek.findUnique({
    where: { slug, status: "published" },
    include: {
      highlights: { orderBy: { sort: "asc" } },
      itinerary: { orderBy: { dayNumber: "asc" } },
      pricingTiers: true,
      availableDates: true,
      faqs: true,
      reviews: { where: { approved: true } },
    },
  });
}

// ── Static data for demo treks (fallback when DB is empty) ───────────
const trekData: Record<string, any> = {
  "everest-base-camp": {
    title: "Everest Base Camp Trek",
    slug: "everest-base-camp",
    price: 1899,
    duration: 14,
    difficulty: "Challenging",
    region: "Everest",
    maxGroupSize: 12,
    subtitle: "Classic Himalayan Adventure",
    overview:
      "The Everest Base Camp trek is the ultimate Himalayan adventure. Fly into Lukla, trek through Sherpa villages and rhododendron forests, cross suspension bridges, and finally stand at the foot of the world's tallest mountain. This journey offers breathtaking views of Everest, Lhotse, Nuptse, and Ama Dablam, along with a deep immersion in Sherpa culture.",
    highlights: [
      { icon: "🏔️", text: "Stand at Everest Base Camp (5,364m)" },
      { icon: "🌅", text: "Sunrise from Kala Patthar (5,545m)" },
      { icon: "🏛️", text: "Visit Tengboche Monastery" },
      { icon: "🛫", text: "Scenic flight to/from Lukla" },
      { icon: "🌲", text: "Trek through Sagarmatha National Park" },
    ],
    itinerary: [
      {
        dayNumber: 1,
        title: "Arrive in Kathmandu",
        description:
          "Arrive at Tribhuvan International Airport. Transfer to your hotel. Evening briefing with your guide about the trek. Last chance to check and rent any gear.",
        elevation: "1,400m",
        accommodation: "Hotel",
      },
      {
        dayNumber: 2,
        title: "Fly to Lukla, Trek to Phakding",
        description:
          "Early morning flight to Lukla (2,860m). Meet your trekking crew and begin trekking downhill to Phakding (2,610m). The short day helps with acclimatization.",
        elevation: "2,860m → 2,610m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 3,
        title: "Trek to Namche Bazaar",
        description:
          "Cross several suspension bridges, including the famous Hillary Bridge. The trail climbs steadily through pine forests to the gateway of the Khumbu region — Namche Bazaar (3,440m).",
        elevation: "2,610m → 3,440m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 4,
        title: "Acclimatization Day in Namche",
        description:
          "A crucial acclimatization day. Hike to the Everest View Hotel for panoramic views of Everest, Lhotse, and Ama Dablam. Visit the Sherpa Museum and local markets.",
        elevation: "3,440m → 3,880m (high hike)",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 5,
        title: "Trek to Tengboche",
        description:
          "Trek through rhododendron forests to Tengboche (3,860m). Visit the famous Tengboche Monastery, the largest in the Khumbu region, with stunning views of Ama Dablam.",
        elevation: "3,440m → 3,860m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 6,
        title: "Trek to Dingboche",
        description:
          "Descend through forests, cross the Imja Khola river, and climb to Dingboche (4,410m). Views of Lhotse, Island Peak, and Makalu accompany the trail.",
        elevation: "3,860m → 4,410m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 7,
        title: "Acclimatization Day in Dingboche",
        description:
          "Acclimatization hike to Nagarjun Hill (5,100m) for panoramic views. Rest and preparation for higher altitudes.",
        elevation: "4,410m → 5,100m (high hike)",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 8,
        title: "Trek to Lobuche",
        description:
          "Continue through the Khumbu Valley, passing memorials dedicated to climbers who lost their lives on Everest. Arrive in Lobuche (4,910m).",
        elevation: "4,410m → 4,910m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 9,
        title: "Trek to Gorak Shep & Everest Base Camp",
        description:
          "A long and rewarding day. Trek to Gorak Shep (5,164m), drop your bags, and continue to Everest Base Camp (5,364m). Stand at the foot of the world's tallest mountain!",
        elevation: "4,910m → 5,364m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 10,
        title: "Kala Patthar Sunrise & Trek to Pheriche",
        description:
          "Pre-dawn hike to Kala Patthar (5,545m) for the best sunrise views of Everest. After photos, descend to Pheriche (4,240m).",
        elevation: "5,164m → 5,545m → 4,240m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 11,
        title: "Trek back to Namche Bazaar",
        description:
          "Follow the trail back through Tengboche and descend to Namche Bazaar. Celebrate your achievement!",
        elevation: "4,240m → 3,440m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 12,
        title: "Trek back to Lukla",
        description:
          "Continue the descent through Phakding to Lukla. Final night celebration with your trekking crew.",
        elevation: "3,440m → 2,860m",
        accommodation: "Teahouse",
      },
      {
        dayNumber: 13,
        title: "Fly back to Kathmandu",
        description:
          "Morning flight back to Kathmandu. Rest at the hotel. Evening farewell dinner at a traditional Nepali restaurant.",
        elevation: "2,860m → 1,400m",
        accommodation: "Hotel",
      },
      {
        dayNumber: 14,
        title: "Departure",
        description:
          "Transfer to the airport for your departure flight. Safe travels!",
        elevation: "-",
        accommodation: "-",
      },
    ],
    inclusions: [
      "Airport pickup and drop-off",
      "Round-trip flight Kathmandu-Lukla",
      "13 nights accommodation (hotel in KTM, teahouses on trek)",
      "All meals during the trek (breakfast, lunch, dinner)",
      "Experienced English-speaking trekking guide",
      "Required porters (1 porter per 2 trekkers)",
      "Sagarmatha National Park entry permit",
      "TIMS (Trekkers' Information Management System) card",
      "First aid kit and pulse oximeter",
      "Down jacket and sleeping bag (rental, if needed)",
      "All government taxes and service charges",
    ],
    exclusions: [
      "International airfare",
      "Nepal entry visa",
      "Travel insurance (mandatory)",
      "Personal trekking gear and equipment",
      "Hot showers and charging fees on trek",
      "Alcoholic beverages and soft drinks",
      "Tips for guide and porters (customary)",
      "Extra accommodation in Kathmandu due to flight delays",
    ],
    pricingTiers: [
      { groupSize: "1 person", pricePerPerson: 2399 },
      { groupSize: "2-3 people", pricePerPerson: 1999 },
      { groupSize: "4-6 people", pricePerPerson: 1899 },
      { groupSize: "7-10 people", pricePerPerson: 1699 },
      { groupSize: "11-12 people", pricePerPerson: 1599 },
    ],
    availableDates: [
      { startDate: "2026-03-15", seatsLeft: 8 },
      { startDate: "2026-04-05", seatsLeft: 5 },
      { startDate: "2026-04-20", seatsLeft: 10 },
      { startDate: "2026-05-10", seatsLeft: 3 },
      { startDate: "2026-09-15", seatsLeft: 12 },
      { startDate: "2026-10-01", seatsLeft: 7 },
      { startDate: "2026-10-20", seatsLeft: 6 },
      { startDate: "2026-11-05", seatsLeft: 4 },
    ],
    faqs: [
      {
        question: "How fit do I need to be?",
        answer:
          "You should be in good physical condition with regular cardio exercise. While no technical climbing is involved, you'll be hiking 5-7 hours daily at high altitude. Regular walking, jogging, or cycling 3-4 times a week for 3 months before the trek is recommended.",
      },
      {
        question: "What's the best time to do this trek?",
        answer:
          "Spring (March-May) and Autumn (September-November) are the best seasons. Spring offers rhododendron blooms and warmer temperatures. Autumn provides crystal-clear skies and excellent mountain views.",
      },
      {
        question: "Do I need travel insurance?",
        answer:
          "Yes, travel insurance is mandatory. It must cover emergency evacuation by helicopter up to 6,000m, trip cancellation, and medical expenses. We recommend World Nomads or similar providers.",
      },
      {
        question: "What about altitude sickness?",
        answer:
          "Our itinerary is designed with proper acclimatization days. Our guides are trained to recognize symptoms and carry emergency oxygen. We follow the 'climb high, sleep low' principle and monitor your oxygen levels daily.",
      },
      {
        question: "Can I charge my devices on the trek?",
        answer:
          "Yes, most teahouses have solar-powered charging stations, though there may be a small fee ($2-5). We recommend bringing a portable power bank.",
      },
    ],
    reviews: [
      {
        author: "Sarah M.",
        rating: 5,
        text: "An absolutely life-changing experience! The guides were incredibly knowledgeable and safety-conscious. Standing at Base Camp was the most humbling moment of my life.",
        approved: true,
      },
      {
        author: "James K.",
        rating: 5,
        text: "From start to finish, everything was perfectly organized. The acclimatization schedule was spot-on — our whole group made it to Base Camp without issues.",
        approved: true,
      },
      {
        author: "Priya R.",
        rating: 4,
        text: "Amazing views, great guides, and wonderful teahouse experiences. The only reason I'm not giving 5 stars is that the toilet facilities on the trail could be better (but that's true for any trek).",
        approved: true,
      },
    ],
    seo: {
      metaTitle: "Everest Base Camp Trek - 14 Days | Mardi Treks",
      metaDescription:
        "Trek to Everest Base Camp with expert guides. 14-day itinerary, stunning mountain views, Sherpa culture, and guaranteed departures. Book your adventure today!",
    },
  },
};

export async function generateStaticParams() {
  // Get published treks from DB + static demo treks
  const dbTreks = await prisma.trek.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  const slugs = [
    ...dbTreks.map((t) => ({ slug: t.slug })),
    ...Object.keys(trekData).map((slug) => ({ slug })),
  ];
  // Deduplicate
  const seen = new Set<string>();
  return slugs.filter((s) => {
    if (seen.has(s.slug)) return false;
    seen.add(s.slug);
    return true;
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbTrek = await getTrek(slug);
  const trek = dbTrek || trekData[slug];
  if (!trek) return {};

  const title = trek.metaTitle || `${trek.title} | Mardi Treks`;
  const description = trek.metaDescription || trek.overview?.slice(0, 160);

  return { title, description, openGraph: { title, description, type: "article" } };
}

// Revalidate every 5 minutes, plus on-demand via revalidation API
export const revalidate = 300;

export default async function TrekDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbTrek = await getTrek(slug);
  const trek = dbTrek || trekData[slug];

  if (!trek) {
    notFound();
  }

  // Normalize data: DB returns nested objects, static data has inline arrays
  const highlights = trek.highlights || trekData[slug]?.highlights || [];
  const itinerary = trek.itinerary || trekData[slug]?.itinerary || [];
  const pricingTiers = trek.pricingTiers || trekData[slug]?.pricingTiers || [];
  const availableDates = trek.availableDates || trekData[slug]?.availableDates || [];
  const faqs = trek.faqs || trekData[slug]?.faqs || [];
  const reviews = trek.reviews || trekData[slug]?.reviews || [];
  const inclusions = (typeof trek.inclusions === "string" ? JSON.parse(trek.inclusions) : trek.inclusions) || [];
  const exclusions = (typeof trek.exclusions === "string" ? JSON.parse(trek.exclusions) : trek.exclusions) || [];
  const waypoints = (typeof trek.waypoints === "string" ? JSON.parse(trek.waypoints) : trek.waypoints) || [];

  const difficultyColorMap: Record<string, string> = {
    Easy: "bg-green-100 text-green-700",
    Moderate: "bg-yellow-100 text-yellow-700",
    Challenging: "bg-orange-100 text-orange-700",
    Difficult: "bg-red-100 text-red-700",
    Extreme: "bg-purple-100 text-purple-700",
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary-dark">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/treks"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Treks
          </Link>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    difficultyColorMap[trek.difficulty] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {trek.difficulty}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                  {trek.region} Region
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {trek.title}
              </h1>
              <p className="mt-3 text-xl text-slate-300">{trek.subtitle}</p>

              {/* Quick Stats */}
              <div className="mt-6 flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-5 w-5 text-primary-light" />
                  <span>{trek.duration} Days</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="h-5 w-5 text-primary-light" />
                  <span>Max {trek.maxGroupSize} people</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-5 w-5 text-primary-light" />
                  <span>{trek.region} Region</span>
                </div>
              </div>

              {/* Rating */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(trek.reviews?.[0]?.rating || 4.8)
                          ? "fill-current text-accent"
                          : "text-slate-500"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-300">
                  {reviews?.length || 0} reviews
                </span>
              </div>

              {/* Price */}
              <div className="mt-6">
                <span className="text-3xl font-bold text-white">
                  ${trek.price.toLocaleString()}
                </span>
                <span className="ml-2 text-slate-300">/ person</span>
              </div>

              {/* CTA */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/book/${slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-dark"
                >
                  Book This Trek
                </Link>
                <Link
                  href="#itinerary"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-500 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  View Itinerary
                </Link>
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary-light/10 p-12">
              <Mountain className="h-32 w-32 text-primary/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-bold text-foreground">Overview</h2>
              <p className="mt-4 text-lg leading-relaxed text-text">{trek.overview}</p>
            </section>

            {/* Highlights */}
            <section>
              <h2 className="text-2xl font-bold text-foreground">Trip Highlights</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {highlights?.map((highlight: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
                    <span className="text-xl">{highlight.icon}</span>
                    <span className="text-sm text-text">{highlight.text}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Itinerary */}
            <section id="itinerary">
              <h2 className="text-2xl font-bold text-foreground">Day-by-Day Itinerary</h2>
              <div className="mt-6 space-y-4">
                {itinerary?.map((day: any) => (
                  <details
                    key={day.dayNumber}
                    className="group overflow-hidden rounded-lg border border-border"
                  >
                    <summary className="flex cursor-pointer items-center justify-between bg-surface px-5 py-4 hover:bg-surface-alt">
                      <div>
                        <span className="text-sm font-medium text-primary">Day {day.dayNumber}</span>
                        <h3 className="mt-0.5 text-base font-semibold text-foreground">{day.title}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        {day.elevation && (
                          <span className="hidden text-xs text-text-muted sm:block">{day.elevation}</span>
                        )}
                        <ChevronDown className="h-5 w-5 text-text-muted transition-transform group-open:rotate-180" />
                      </div>
                    </summary>
                    <div className="border-t border-border px-5 py-4">
                      <p className="text-sm leading-relaxed text-text">{day.description}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
                        {day.elevation && <span>Elevation: {day.elevation}</span>}
                        {day.accommodation && <span>Accommodation: {day.accommodation}</span>}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Map Section - Interactive 3D Map */}
            <section id="map">
              <h2 className="text-2xl font-bold text-foreground">Route Map</h2>
              <p className="mt-2 text-sm text-text-muted">
                Explore the 3D terrain map showing the actual trek route.
              </p>
              <div className="mt-4">
                <TrekMapWrapper
                  geoJsonUrl={trek.geoJsonUrl || undefined}
                  geoJsonData={trek.geoJsonData || null}
                  waypoints={waypoints?.length > 0 ? waypoints : undefined}
                  itinerary={itinerary?.length > 0 ? itinerary : undefined}
                  staticFallbackImage={trek.staticMapImage || undefined}
                />
              </div>
            </section>

            {/* Inclusions & Exclusions */}
            <section className="grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">Inclusions</h2>
                <ul className="mt-4 space-y-2">
                  {inclusions?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Exclusions</h2>
                <ul className="mt-4 space-y-2">
                  {exclusions?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text">
                      <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* FAQs */}
            <section>
              <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
              <div className="mt-6 space-y-3">
                {faqs?.map((faq: any, i: number) => (
                  <details key={i} className="group overflow-hidden rounded-lg border border-border">
                    <summary className="flex cursor-pointer items-center justify-between bg-surface px-5 py-4 hover:bg-surface-alt">
                      <span className="text-sm font-semibold text-foreground">{faq.question}</span>
                      <ChevronDown className="h-5 w-5 shrink-0 text-text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-border px-5 py-4">
                      <p className="text-sm leading-relaxed text-text">{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="text-2xl font-bold text-foreground">Guest Reviews</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {reviews
                  ?.filter((r: any) => r.approved)
                  .map((review: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border bg-surface p-5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            className={`h-4 w-4 ${
                              j < review.rating ? "fill-current text-accent" : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-text">{review.text}</p>
                      <p className="mt-3 text-xs font-medium text-text-muted">— {review.author}</p>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground">Pricing</h3>
                <div className="mt-4 space-y-3">
                  {pricingTiers?.map((tier: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                    >
                      <span className="text-sm text-text">{tier.groupSize}</span>
                      <span className="text-sm font-bold text-primary">
                        ${tier.pricePerPerson.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/book/${slug}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Book Now
                </Link>
              </div>

              {/* Available Dates */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground">Available Dates</h3>
                <div className="mt-4 space-y-2">
                  {availableDates?.map((date: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm text-text">
                          {new Date(date.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          date.seatsLeft > 5
                            ? "text-success"
                            : date.seatsLeft > 0
                              ? "text-warning"
                              : "text-error"
                        }`}
                      >
                        {date.seatsLeft > 0 ? `${date.seatsLeft} seats` : "Full"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
