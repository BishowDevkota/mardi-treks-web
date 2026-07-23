"use client";

import { useState } from "react";
import { Search, X, Star, Mountain } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Trek {
  id: string;
  title: string;
  slug: string;
  region: string;
  difficulty: string;
  duration: number;
  price: number;
  heroImage?: string | null;
  _count?: { reviews: number };
}

export function FeaturedTrekSelector({
  treks,
  initialFeaturedIds,
  initialFeaturedSectionIds,
}: {
  treks: Trek[];
  initialFeaturedIds: string[];
  initialFeaturedSectionIds: string[];
}) {
  const [featuredIds, setFeaturedIds] = useState<string[]>(initialFeaturedIds);
  const [featuredSectionIds, setFeaturedSectionIds] = useState<string[]>(initialFeaturedSectionIds);
  const [addingToHero, setAddingToHero] = useState(true);
  const [search, setSearch] = useState("");

  const featuredTreks = featuredIds
    .map((id) => treks.find((t) => t.id === id))
    .filter(Boolean) as Trek[];

  const featuredSectionTreks = featuredSectionIds
    .map((id) => treks.find((t) => t.id === id))
    .filter(Boolean) as Trek[];

  const availableTreks = treks.filter((t) => {
    const alreadyInTarget = addingToHero
      ? featuredIds.includes(t.id)
      : featuredSectionIds.includes(t.id);
    return !alreadyInTarget && (
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.region?.toLowerCase().includes(search.toLowerCase())
    );
  });

  function addTrek(id: string) {
    if (addingToHero) setFeaturedIds((prev) => [...prev, id]);
    else setFeaturedSectionIds((prev) => [...prev, id]);
  }

  function removeTrek(id: string) {
    setFeaturedIds((prev) => prev.filter((fid) => fid !== id));
  }

  function removeFeaturedSection(id: string) {
    setFeaturedSectionIds((prev) => prev.filter((fid) => fid !== id));
  }

  function moveTrek(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= featuredIds.length) return;
    const newIds = [...featuredIds];
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setFeaturedIds(newIds);
  }

  function moveFeaturedSection(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= featuredSectionIds.length) return;
    const newIds = [...featuredSectionIds];
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setFeaturedSectionIds(newIds);
  }

  return (
    <>
      {/* Hidden fields to pass data to form */}
      <input type="hidden" name="featuredTrekIds" value={JSON.stringify(featuredIds)} />
      <input type="hidden" name="featuredSectionTrekIds" value={JSON.stringify(featuredSectionIds)} />

      {/* Hero Carousel Treks */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-900">Hero Carousel — Display Treks</h3>
        <p className="mt-1 text-xs text-slate-400">
          Select and reorder the treks that will appear in the homepage hero carousel.
        </p>

        {featuredTreks.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-10">
            <Mountain className="h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">No treks selected for carousel</p>
            <p className="text-xs text-slate-400">Select treks from the list below</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {featuredTreks.map((trek, index) => (
              <div key={trek.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-all hover:border-teal-200 hover:bg-teal-50/30">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveTrek(index, "up")} disabled={index === 0}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">▲</button>
                  <button type="button" onClick={() => moveTrek(index, "down")} disabled={index === featuredTreks.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">▼</button>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 text-sm font-bold text-teal-700">#{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{trek.title}</p>
                  <p className="text-xs text-slate-400">{trek.duration} days · {trek.region} · {formatPrice(trek.price)}</p>
                </div>
                <button type="button" onClick={() => removeTrek(trek.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Treks Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-900">Featured Treks Section</h3>
        <p className="mt-1 text-xs text-slate-400">
          Select treks to display as featured cards below the hero section.
        </p>

        {featuredSectionTreks.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-10">
            <Mountain className="h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">No featured treks selected</p>
            <p className="text-xs text-slate-400">Select treks from the list below</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {featuredSectionTreks.map((trek, index) => (
              <div key={trek.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-all hover:border-orange-200 hover:bg-orange-50/30">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveFeaturedSection(index, "up")} disabled={index === 0}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">▲</button>
                  <button type="button" onClick={() => moveFeaturedSection(index, "down")} disabled={index === featuredSectionTreks.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">▼</button>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 text-sm font-bold text-orange-700">#{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{trek.title}</p>
                  <p className="text-xs text-slate-400">{trek.duration} days · {trek.region} · {formatPrice(trek.price)}</p>
                </div>
                <button type="button" onClick={() => removeFeaturedSection(trek.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Treks Search */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Available Treks</h3>
            <p className="text-xs text-slate-400">Click to add treks — choose which section to add them to</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAddingToHero(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${addingToHero ? "bg-teal-100 text-teal-700 ring-1 ring-teal-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              Hero Carousel
            </button>
            <button type="button" onClick={() => setAddingToHero(false)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${!addingToHero ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              Featured Section
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search treks by name or region..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {availableTreks.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="text-sm text-slate-400">
                {search ? "No treks match your search." : `All treks are already added to the ${addingToHero ? "Hero Carousel" : "Featured Section"}.`}
              </p>
            </div>
          ) : (
            availableTreks.slice(0, 20).map((trek) => (
              <button key={trek.id} type="button" onClick={() => addTrek(trek.id)}
                className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-left transition-all hover:border-teal-300 hover:bg-teal-50/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">🏔️</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{trek.title}</p>
                  <p className="text-xs text-slate-400">{trek.duration}d · {trek.region} · {formatPrice(trek.price)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">{trek.difficulty}</span>
                    {trek._count && (
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><Star className="h-3 w-3" /> {trek._count.reviews} reviews</span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${addingToHero ? "bg-teal-100 text-teal-700" : "bg-orange-100 text-orange-700"}`}>
                  + {addingToHero ? "Carousel" : "Featured"}
                </span>
              </button>
            ))
          )}
        </div>
        {availableTreks.length > 20 && (
          <p className="mt-2 text-center text-xs text-slate-400">Showing 20 of {availableTreks.length} treks. Use search to narrow results.</p>
        )}
      </section>
    </>
  );
}
