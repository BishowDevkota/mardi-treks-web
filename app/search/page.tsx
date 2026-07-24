import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Search, MapPin, Clock, TrendingUp, ArrowLeft, Mountain, ArrowRight } from "lucide-react";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Search Treks | Mardi Treks",
  description: "Search and discover trekking packages in Nepal. Find your perfect Himalayan adventure.",
  alternates: { canonical: "https://marditreks.com/search" },
  openGraph: {
    title: "Search Treks | Mardi Treks",
    description: "Search and discover trekking packages in Nepal.",
  },
};

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
    region: string | null;
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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {query ? `Results for "${query}"` : "Search Treks"}
              </h1>
              <p className="text-sm text-text-muted">
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
                  className="group overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:shadow-md"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-surface-alt">
                    {trek.heroImage ? (
                      <Image
                        src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_600,q_auto,f_auto/${trek.heroImage}`}
                        alt={trek.title}
                        width={600}
                        height={338}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Mountain className="h-12 w-12 text-text-muted" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      {trek.region && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          {trek.region}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-medium capitalize text-text-muted">
                        {trek.difficulty}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-foreground group-hover:text-primary">
                      {trek.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {trek.duration}d
                        </span>
                        {trek.region && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {trek.region}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-primary">
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt">
              <Search className="h-8 w-8 text-text-muted" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-foreground">No treks found</h2>
            <p className="mt-2 text-sm text-text-muted">
              We couldn&apos;t find any treks matching &ldquo;{query}&rdquo;. Try a different search term.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
            >
              <ArrowLeft className="h-4 w-4" /> Go to Home
            </Link>
          </div>
        ) : (
          /* Initial state (no query) */
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt">
              <Search className="h-8 w-8 text-text-muted" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-foreground">Search for a trek</h2>
            <p className="mt-2 text-sm text-text-muted">
              Type a trek name, region, or destination in the search bar on the homepage.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
            >
              <ArrowLeft className="h-4 w-4" /> Go to Home
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
