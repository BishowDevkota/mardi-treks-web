"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, Mountain, Star, SlidersHorizontal, X, ChevronDown } from "lucide-react";

interface TrekCard {
  id: string;
  title: string;
  slug: string;
  heroImage: string | null;
  difficulty: string;
  duration: number;
  price: number;
  avgRating: number | null;
}

const difficultyStyles: Record<string, { badge: string; dot: string }> = {
  easy: { badge: "bg-[#EEF3E8] text-[#4C6B45]", dot: "bg-[#6B8E5F]" },
  moderate: { badge: "bg-[#FBF0DE] text-[#9A6A1F]", dot: "bg-[#DB8A3A]" },
  challenging: { badge: "bg-[#FBE7DD] text-[#A24E2E]", dot: "bg-[#C25B36]" },
  difficult: { badge: "bg-[#F8DEDE] text-[#9C3939]", dot: "bg-[#B23F3F]" },
  extreme: { badge: "bg-[#EBE1F2] text-[#6B4C8A]", dot: "bg-[#7E5AA3]" },
};

export function CategoryClient({
  catSlug,
  categoryName,
  treks,
  hasActiveFilters,
  clearUrl,
}: {
  catSlug: string;
  categoryName: string;
  treks: TrekCard[];
  hasActiveFilters: boolean;
  clearUrl: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return treks;
    const q = searchQuery.toLowerCase();
    return treks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.difficulty.toLowerCase().includes(q)
    );
  }, [treks, searchQuery]);

  return (
    <>
      {/* Search bar */}
      <div className="mt-6 mx-auto max-w-md relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search treks..."
          className="w-full rounded-full border border-border bg-surface py-3 pl-12 pr-5 text-sm text-foreground placeholder:text-text-muted shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* Result count */}
      <p className="mb-5 text-sm text-text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "trek" : "treks"}
        {searchQuery && (
          <span className="text-text-muted">
            {" "}for &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </p>

      {/* Active filters notice */}
      {hasActiveFilters && (
        <div className="mb-4">
          <Link
            href={clearUrl}
            className="text-xs font-medium text-primary underline decoration-dotted hover:text-primary-dark"
          >
            Clear all filters
          </Link>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-surface p-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-alt">
            <Mountain className="h-6 w-6 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {searchQuery ? "No treks match your search" : "No treks found"}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {searchQuery
              ? "Try a different search term."
              : "Try widening your filters."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((trek) => {
            const rating = trek.avgRating;
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
                    <div className="flex h-full w-full items-center justify-center bg-surface">
                      <Mountain className="h-12 w-12 text-text-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {rating !== null && (
                    <div className="absolute bottom-3 left-3 z-10 text-lg font-bold text-amber-400 drop-shadow-lg">
                      {"★".repeat(Math.round(rating))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors group-hover:bg-primary group-hover:text-white">
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
      )}
    </>
  );
}
