import Link from "next/link";
import { Mountain, Clock, Star } from "lucide-react";

interface FeaturedTrek {
  id: string;
  slug: string;
  title: string;
  heroImage?: string | null;
  difficulty: string;
  duration: number;
  price: number;
  category?: { slug: string } | null;
  reviews?: { rating: number }[];
}

export function FeaturedTreksSection({
  treks,
  heading,
  description,
}: {
  treks: FeaturedTrek[];
  heading?: string | null;
  description?: string | null;
}) {
  if (treks.length === 0) return null;

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{heading || "Featured Treks"}</h2>
          <p className="mt-3 text-lg text-text-muted">{description || "Handpicked adventures for every type of traveler"}</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {treks.map((trek) => {
            const catSlug = trek.category?.slug || "treks";
            const avgRating =
              trek.reviews && trek.reviews.length > 0
                ? (trek.reviews.reduce((s: number, r: any) => s + r.rating, 0) / trek.reviews.length).toFixed(1)
                : null;
            return (
              <Link
                key={trek.id}
                href={`/${catSlug}/${trek.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(234,88,12,0.25)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {trek.heroImage ? (
                    <img
                      src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_600,q_auto,f_auto/${trek.heroImage}`}
                      alt={trek.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface">
                      <Mountain className="h-12 w-12 text-text-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {avgRating && (
                    <div className="absolute bottom-3 left-3 z-10 text-lg font-bold text-amber-400 drop-shadow-lg">
                      {"★".repeat(Math.round(parseFloat(avgRating)))}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      {trek.category?.slug || "trek"}
                    </span>
                    <span className="rounded-full bg-surface-alt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {trek.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {trek.title}
                  </h3>
                  <div className="mt-auto pt-6 flex items-end justify-between">
                    <div className="flex flex-col gap-1 text-xs text-text-muted font-medium">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {trek.duration} Days
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">From</span>
                      <span className="text-xl font-black text-foreground">${trek.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
