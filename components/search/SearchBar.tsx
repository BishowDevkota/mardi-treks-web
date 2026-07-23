"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Search, MapPin, ArrowRight } from "lucide-react";

interface Trek {
  title: string;
  slug: string;
  region: string | null;
  difficulty: string;
  duration: number;
  category?: { slug: string } | null;
}

export function SearchBar({ treks }: { treks: Trek[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return treks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.region?.toLowerCase() ?? "").includes(q)
    ).slice(0, 8);
  }, [query, treks]);

  function goToProduct(trek: Trek) {
    const categorySlug = trek.category?.slug || "treks";
    router.push(`/${categorySlug}/${trek.slug}`);
  }

  function handleSearch(val: string) {
    if (!val.trim()) return;
    router.push(`/search?q=${encodeURIComponent(val.trim())}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        goToProduct(suggestions[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  }

  return (
    <div className="relative w-full" onMouseLeave={() => setSelectedIndex(-1)}>
      <div className="flex w-full items-center gap-0 overflow-hidden rounded-full border border-white/20 bg-white shadow-lg shadow-black/20 backdrop-blur-sm transition-all focus-within:border-primary/50 focus-within:shadow-primary/10">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Where do you want to go?"
          className="flex-1 border-none bg-transparent px-5 py-4 text-base text-foreground placeholder-text-muted outline-none"
        />
        <button
          type="button"
          onClick={() => handleSearch(query)}
          className="mr-1.5 flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
        >
          <Search className="h-4 w-4" />
          Explore Now
        </button>
      </div>

      {focused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          {suggestions.map((trek, i) => {
            const q = query.toLowerCase();
            const matchIdx = trek.title.toLowerCase().indexOf(q);
            const before = matchIdx > 0 ? trek.title.slice(0, matchIdx) : "";
            const match =
              matchIdx >= 0
                ? trek.title.slice(matchIdx, matchIdx + q.length)
                : "";
            const after =
              matchIdx >= 0 ? trek.title.slice(matchIdx + q.length) : trek.title;

            return (
              <button
                key={trek.slug}
                type="button"
                onMouseDown={() => goToProduct(trek)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i === selectedIndex ? "bg-primary/10" : "hover:bg-surface-alt"
                }`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {before}
                    <span className="bg-primary/20 font-semibold text-primary">
                      {match}
                    </span>
                    {after}
                  </p>
                  <p className="text-xs text-text-muted">
                    {(trek.region || "Nepal")} · {trek.duration} days · {trek.difficulty}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
