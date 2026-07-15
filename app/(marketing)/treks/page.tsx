import type { Metadata } from "next";
import Link from "next/link";
import { Mountain, Star, ArrowRight, Search, SlidersHorizontal } from "lucide-react";

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

// TODO: Fetch from Payload CMS using getPayloadClient()
const allTreks = [
  {
    slug: "everest-base-camp",
    title: "Everest Base Camp Trek",
    subtitle: "Classic Himalayan Adventure",
    duration: 14,
    price: 1899,
    difficulty: "Challenging",
    region: "Everest",
    rating: 4.9,
    reviews: 128,
    maxGroupSize: 12,
    highlights: ["Sagarmatha National Park", "Kala Patthar Sunrise", "Sherpa Culture"],
  },
  {
    slug: "annapurna-circuit",
    title: "Annapurna Circuit Trek",
    subtitle: "Diverse Landscapes & Culture",
    duration: 16,
    price: 1599,
    difficulty: "Moderate",
    region: "Annapurna",
    rating: 4.8,
    reviews: 95,
    maxGroupSize: 14,
    highlights: ["Thorong La Pass (5,416m)", "Poon Hill Sunrise", "Muktinath Temple"],
  },
  {
    slug: "mardi-himal-trek",
    title: "Mardi Himal Trek",
    subtitle: "Off the Beaten Path",
    duration: 10,
    price: 1199,
    difficulty: "Moderate",
    region: "Annapurna",
    rating: 4.7,
    reviews: 67,
    maxGroupSize: 10,
    highlights: ["Mardi Himal Base Camp", "Forest Campsites", "Panoramic Mountain Views"],
  },
  {
    slug: "langtang-valley",
    title: "Langtang Valley Trek",
    subtitle: "Wilderness & Tamang Culture",
    duration: 11,
    price: 1099,
    difficulty: "Moderate",
    region: "Langtang",
    rating: 4.6,
    reviews: 52,
    maxGroupSize: 10,
    highlights: ["Langtang National Park", "Kyanjin Gompa", "Tibetan Buddhist Culture"],
  },
  {
    slug: "ghorepani-poon-hill",
    title: "Ghorepani Poon Hill Trek",
    subtitle: "Short & Scenic",
    duration: 7,
    price: 799,
    difficulty: "Easy",
    region: "Annapurna",
    rating: 4.5,
    reviews: 89,
    maxGroupSize: 14,
    highlights: ["Poon Hill Sunrise", "Rhododendron Forests", "Annapurna Panorama"],
  },
  {
    slug: "upper-mustang",
    title: "Upper Mustang Trek",
    subtitle: "The Forbidden Kingdom",
    duration: 18,
    price: 2499,
    difficulty: "Moderate",
    region: "Mustang",
    rating: 4.8,
    reviews: 41,
    maxGroupSize: 8,
    highlights: ["Lo Manthang City", "Ancient Caves", "Unique Tibetan Culture"],
  },
];

const difficultyColors: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Moderate: "bg-yellow-100 text-yellow-700",
  Challenging: "bg-orange-100 text-orange-700",
  Difficult: "bg-red-100 text-red-700",
  Extreme: "bg-purple-100 text-purple-700",
};

export default function TreksPage() {
  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Trekking Packages
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Discover our handpicked selection of trekking adventures across Nepal&apos;s most
              stunning regions. Each journey is crafted for safety, comfort, and unforgettable experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Filters (placeholder - will be interactive with client component) */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-text-muted">Filter by:</span>
            {["All", "Everest", "Annapurna", "Langtang", "Mustang"].map((region) => (
              <Link
                key={region}
                href={region === "All" ? "/treks" : `/treks?region=${region.toLowerCase()}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  region === "All"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {region}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trek Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {allTreks.map((trek) => (
              <Link
                key={trek.slug}
                href={`/treks/${trek.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary-light/5 p-8">
                  <Mountain className="h-16 w-16 text-primary/30" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        difficultyColors[trek.difficulty] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {trek.difficulty}
                    </span>
                    <span className="text-xs font-medium text-text-muted">
                      {trek.duration} days
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-foreground group-hover:text-primary">
                    {trek.title}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">{trek.subtitle}</p>
                  <div className="mt-3 flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-current text-accent" />
                    <span className="font-medium text-foreground">{trek.rating}</span>
                    <span className="text-text-muted">({trek.reviews} reviews)</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs text-text-muted">{trek.region} Region</span>
                    <span className="text-lg font-bold text-primary">
                      ${trek.price.toLocaleString()}
                      <span className="text-xs font-normal text-text-muted">/person</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
