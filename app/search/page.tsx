import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search, MapPin, Clock, TrendingUp, ArrowLeft, Mountain, ArrowRight } from "lucide-react";

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  let results: Array<{
    id: string;
    title: string;
    slug: string;
    region: string;
    difficulty: string;
    duration: number;
    price: number;
    heroImage?: string | null;
    category?: { slug: string } | null;
  }> = [];

  if (query) {
    const qLower = query.toLowerCase();
    results = await prisma.trek.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: qLower, mode: "insensitive" } },
          { region: { contains: qLower, mode: "insensitive" } },
          { subtitle: { contains: qLower, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        region: true,
        difficulty: true,
        duration: true,
        price: true,
        heroImage: true,
        category: { select: { slug: true } },
      },
      orderBy: { title: "asc" },
      take: 50,
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-teal-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
              <Search className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {query ? `Results for "${query}"` : "Search Treks"}
              </h1>
              <p className="text-sm text-slate-500">
                {results.length > 0
                  ? `${results.length} trek${results.length === 1 ? "" : "s"} found`
                  : query
                    ? "No treks matched your search"
                    : "Enter a search term to find treks"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {results.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((trek) => {
              const categorySlug = trek.category?.slug || "treks";
              return (
                <Link
                  key={trek.id}
                  href={`/${categorySlug}/${trek.slug}`}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                    {trek.heroImage ? (
                      <img
                        src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_600,q_auto,f_auto/${trek.heroImage}`}
                        alt={trek.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Mountain className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
                        {trek.region}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                        {trek.difficulty}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-teal-600">
                      {trek.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {trek.duration}d
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {trek.region}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-teal-600">
                        ${trek.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : query ? (
          /* No results state */
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">No treks found</h2>
            <p className="mt-2 text-sm text-slate-500">
              We couldn&apos;t find any treks matching &ldquo;{query}&rdquo;. Try a different search term.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700"
            >
              <ArrowLeft className="h-4 w-4" /> Go to Home
            </Link>
          </div>
        ) : (
          /* Initial state (no query) */
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">Search for a trek</h2>
            <p className="mt-2 text-sm text-slate-500">
              Type a trek name, region, or destination in the search bar on the homepage.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700"
            >
              <ArrowLeft className="h-4 w-4" /> Go to Home
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
