import Link from "next/link";
import { Mountain, Clock, Star, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";

export async function BestSellingTreks({
  heading,
  description,
}: {
  heading?: string | null;
  description?: string | null;
}) {
  // Group bookings by trekSlug to find the most booked treks
  const bookingCounts = await prisma.booking.groupBy({
    by: ["trekSlug"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 3,
  });

  if (bookingCounts.length === 0) {
    return null;
  }

  const topSlugs = bookingCounts.map((b) => b.trekSlug);

  // Fetch the full trek data for those slugs
  const treks = await prisma.trek.findMany({
    where: {
      slug: { in: topSlugs },
      status: "published",
    },
    include: {
      category: { select: { slug: true } },
      reviews: { where: { approved: true }, select: { rating: true } },
      _count: { select: { reviews: true } },
    },
  });

  if (treks.length === 0) {
    return null;
  }

  // Preserve the order from booking counts
  treks.sort((a, b) => topSlugs.indexOf(a.slug) - topSlugs.indexOf(b.slug));

  // Merge booking count into trek data
  const trekCountMap = new Map(bookingCounts.map((b) => [b.trekSlug, b._count.id]));
  const treksWithMeta = treks.map((trek) => {
    const reviews = trek.reviews;
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;
    return {
      ...trek,
      bookingCount: trekCountMap.get(trek.slug) || 0,
      avgRating,
    };
  });

  return (
    <section className="bg-background py-16 sm:py-20" aria-labelledby="best-selling-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <h2
            id="best-selling-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {heading || "Best Selling Treks"}
          </h2>
          <p className="mt-3 text-lg text-text-muted">
            {description || "Our most booked adventures — trusted by trekkers worldwide"}
          </p>
        </div>

        {/* Trek cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {treksWithMeta.map((trek, index) => {
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
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-primary">
                      <TrendingUp className="h-3 w-3" />
                      {trek.bookingCount} booking{trek.bookingCount !== 1 ? "s" : ""}
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
