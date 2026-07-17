import Link from "next/link";
import { Mountain, Clock, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";

export async function TopRatedTreks({
  heading,
  description,
}: {
  heading?: string | null;
  description?: string | null;
}) {
  // Group reviews by trekId, calculate average rating, and get top 3
  const ratingAggs = await prisma.trekReview.groupBy({
    by: ["trekId"],
    where: { approved: true },
    _avg: { rating: true },
    _count: { id: true },
    orderBy: { _avg: { rating: "desc" } },
    take: 6, // Fetch more to allow filtering for published treks
  });

  if (ratingAggs.length === 0) {
    return null;
  }

  const topTrekIds = ratingAggs.map((r) => r.trekId);

  // Fetch the full trek data
  const treks = await prisma.trek.findMany({
    where: {
      id: { in: topTrekIds },
      status: "published",
    },
    include: {
      category: { select: { slug: true } },
      _count: { select: { reviews: true } },
    },
  });

  if (treks.length === 0) {
    return null;
  }

  // Build a map of trekId → rating data
  const ratingMap = new Map(
    ratingAggs.map((r) => [r.trekId, { avg: r._avg.rating ?? 0, count: r._count.id }])
  );

  // Sort by average rating descending, then take top 3
  const sorted = treks
    .map((trek) => ({
      ...trek,
      avgRating: ratingMap.get(trek.id)?.avg.toFixed(1) ?? null,
      reviewCount: ratingMap.get(trek.id)?.count ?? 0,
    }))
    .sort((a, b) => {
      const avgA = ratingMap.get(a.id)?.avg ?? 0;
      const avgB = ratingMap.get(b.id)?.avg ?? 0;
      return avgB - avgA;
    })
    .slice(0, 3);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <section className="bg-background py-16 sm:py-20" aria-labelledby="top-rated-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <h2
            id="top-rated-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {heading || "Top Rated Treks"}
          </h2>
          <p className="mt-3 text-lg text-text-muted">
            {description || "Highest-rated adventures loved by our community"}
          </p>
        </div>

        {/* Trek cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((trek, index) => {
            const catSlug = trek.category?.slug || "treks";
            return (
              <Link
                key={trek.id}
                href={`/${catSlug}/${trek.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(234,88,12,0.25)]"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {trek.heroImage ? (
                    <img
                      src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_600,q_auto,f_auto/${trek.heroImage}`}
                      alt={trek.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-alt">
                      <Mountain className="h-12 w-12 text-text-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {trek.avgRating && (
                    <div className="absolute bottom-3 left-3 z-10 text-lg font-bold text-amber-400 drop-shadow-lg">
                      {"★".repeat(Math.round(parseFloat(trek.avgRating)))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-6">
                  {/* Badges */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      {trek.category?.slug || "trek"}
                    </span>
                    <span className="rounded-full bg-surface-alt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {trek.difficulty}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-500">
                      <Star className="h-4 w-4 fill-amber-400" />
                      {trek.avgRating}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {trek.title}
                  </h3>

                  {/* Footer */}
                  <div className="mt-auto flex items-end justify-between pt-6">
                    <div className="flex flex-col gap-1 text-xs font-medium text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {trek.duration} Days
                      </span>

                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">From</span>
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
