"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Star, Search, Mountain, Upload, Loader2, ImageIcon, Plus, Trash2, GripVertical } from "lucide-react";
import { updateHomeSettings } from "./actions";
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

interface HeroContent {
  heroEnabled: boolean;
  heroBadge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
}

interface SectionContent {
  featuredTreksHeading: string;
  featuredTreksDescription: string;
  bestSellingTreksHeading: string;
  bestSellingTreksDescription: string;
  topRatedTreksHeading: string;
  topRatedTreksDescription: string;
  reviewsHeading: string;
  reviewsDescription: string;
  blogHeading: string;
  blogDescription: string;
}

interface WhyChooseItem {
  icon: string;
  title: string;
  description: string;
}

interface WhyChooseUsContent {
  whyChooseUsEnabled: boolean;
  whyChooseUsSubtitle: string;
  whyChooseUsHeading: string;
  whyChooseUsItems: WhyChooseItem[];
  whyChooseUsBgImage: string;
}

const AVAILABLE_ICONS = [
  "Shield", "Users", "Leaf", "Heart", "Tag", "CreditCard",
  "Map", "Star", "Mountain", "Compass", "Globe", "Award", "Smile", "Sun",
];

export function HomeForm({
  treks,
  initialFeaturedIds,
  initialFeaturedSectionIds,
  heroContent,
  sectionContent,
  whyChooseUsContent,
  contactContent,
}: {
  treks: Trek[];
  initialFeaturedIds: string[];
  initialFeaturedSectionIds: string[];
  heroContent: HeroContent;
  sectionContent: SectionContent;
  whyChooseUsContent: WhyChooseUsContent;
  contactContent: { contactHeading: string; contactDescription: string };
}) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [featuredIds, setFeaturedIds] = useState<string[]>(initialFeaturedIds);
  const [featuredSectionIds, setFeaturedSectionIds] = useState<string[]>(initialFeaturedSectionIds);
  const [search, setSearch] = useState("");
  const [addingToHero, setAddingToHero] = useState(true);
  const [heroImage, setHeroImage] = useState(heroContent.heroImage);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(
    heroContent.heroImage ? `https://res.cloudinary.com/dk7ggjvlw/image/upload/${heroContent.heroImage}` : null
  );
  const [whyChooseItems, setWhyChooseItems] = useState<WhyChooseItem[]>(
    whyChooseUsContent.whyChooseUsItems.length > 0
      ? whyChooseUsContent.whyChooseUsItems
      : [
          { icon: "Shield", title: "Safety First", description: "All our guides are certified, first-aid trained, and carry satellite communication." },
          { icon: "Users", title: "Expert Local Guides", description: "Our guides have decades of combined experience across Nepal's trekking regions." },
        ],
  );

  function addWhyChooseItem() {
    setWhyChooseItems([...whyChooseItems, { icon: "Shield", title: "", description: "" }]);
  }

  function updateWhyChooseItem(index: number, field: keyof WhyChooseItem, value: string) {
    const updated = [...whyChooseItems];
    (updated[index] as any)[field] = value;
    setWhyChooseItems(updated);
  }

  function removeWhyChooseItem(index: number) {
    setWhyChooseItems(whyChooseItems.filter((_, i) => i !== index));
  }

  const featuredTreks = featuredIds
    .map((id) => treks.find((t) => t.id === id))
    .filter(Boolean) as Trek[];

  const featuredSectionSelected = featuredSectionIds
    .map((id) => treks.find((t) => t.id === id))
    .filter(Boolean) as Trek[];

  const availableTreks = treks.filter(
    (t) => {
      // Only exclude from the currently active section — a trek can be in both
      const alreadyInTarget = addingToHero
        ? featuredIds.includes(t.id)
        : featuredSectionIds.includes(t.id);
      return !alreadyInTarget && (
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.region?.toLowerCase().includes(search.toLowerCase())
      );
    }
  );

  function addTrek(id: string) {
    if (addingToHero) {
      setFeaturedIds((prev) => [...prev, id]);
    } else {
      setFeaturedSectionIds((prev) => [...prev, id]);
    }
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

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", "mardi-treks");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.publicId) {
        setHeroImage(data.publicId);
        setHeroImagePreview(`https://res.cloudinary.com/dk7ggjvlw/image/upload/${data.publicId}`);
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
    setUploading(false);
  }

  function handleClearImage() {
    setHeroImage("");
    setHeroImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("featuredTrekIds", JSON.stringify(featuredIds));
    fd.set("featuredSectionTrekIds", JSON.stringify(featuredSectionIds));
    fd.set("heroImage", heroImage);
    fd.set("whyChooseUsItems", JSON.stringify(whyChooseItems));
    try {
      await updateHomeSettings(fd);
    } catch {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-8">

      {/* Hero Content Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Company Hero Slide</h2>
            <p className="mt-1 text-xs text-slate-400">
              The first slide in the carousel — introduces your company to visitors
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              name="heroEnabled"
              defaultChecked={heroContent.heroEnabled}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Show company slide
          </label>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500">Badge Text</label>
              <input
                name="heroBadge"
                defaultValue={heroContent.heroBadge}
                placeholder="Nepal's Premier Trekking Agency"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Title</label>
              <input
                name="heroTitle"
                defaultValue={heroContent.heroTitle}
                placeholder="Discover the"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Title Highlight</label>
              <input
                name="heroTitleHighlight"
                defaultValue={heroContent.heroTitleHighlight}
                placeholder="Himalayas"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
              <p className="mt-0.5 text-[10px] text-slate-400">This word appears in an accent color</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Subtitle</label>
              <input
                name="heroSubtitle"
                defaultValue={heroContent.heroSubtitle}
                placeholder="With Expert Guides"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Description</label>
              <textarea
                name="heroDescription"
                rows={4}
                defaultValue={heroContent.heroDescription}
                placeholder="From Everest Base Camp to hidden valleys, experience Nepal's breathtaking landscapes..."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Background Image</label>
            {heroImagePreview ? (
              <div className="relative group overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImagePreview} alt="" className="h-48 w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading}
                    className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white">
                    {uploading ? "Uploading..." : "Change"}
                  </button>
                  <button type="button" onClick={handleClearImage}
                    className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  </div>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading}
                className="flex h-48 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-teal-300 hover:bg-teal-50">
                {uploading ? (
                  <div className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
                    <p className="mt-1 text-xs text-slate-500">Uploading...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-1 text-xs font-medium text-slate-500">Company background image</p>
                    <p className="text-[10px] text-slate-400">Recommended: 1920x1080</p>
                  </div>
                )}
              </button>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }} />
          </div>
        </div>
      </section>

      {/* Hero Carousel — Display Treks */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Hero Carousel — Display Treks</h2>
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
              <div
                key={trek.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-all hover:border-teal-200 hover:bg-teal-50/30"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveTrek(index, "up")}
                    disabled={index === 0}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTrek(index, "down")}
                    disabled={index === featuredTreks.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▼
                  </button>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 text-sm font-bold text-teal-700">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{trek.title}</p>
                  <p className="text-xs text-slate-400">
                    {trek.duration} days · {trek.region} · {formatPrice(trek.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeTrek(trek.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Treks Section (Cards below hero) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Featured Treks Section</h2>
        <p className="mt-1 text-xs text-slate-400">
          Select treks to display as featured cards below the hero section on the homepage.
        </p>

        {featuredSectionSelected.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-10">
            <Mountain className="h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">No featured treks selected</p>
            <p className="text-xs text-slate-400">Select treks from the list below to show as featured cards</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {featuredSectionSelected.map((trek, index) => (
              <div
                key={trek.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-all hover:border-orange-200 hover:bg-orange-50/30"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveFeaturedSection(index, "up")}
                    disabled={index === 0}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeaturedSection(index, "down")}
                    disabled={index === featuredSectionSelected.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▼
                  </button>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 text-sm font-bold text-orange-700">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{trek.title}</p>
                  <p className="text-xs text-slate-400">
                    {trek.duration} days · {trek.region} · {formatPrice(trek.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFeaturedSection(trek.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Treks to Hero or Featured */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Available Treks</h2>
            <p className="mt-1 text-xs text-slate-400">
              Click to add treks — choose which section to add them to
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddingToHero(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                addingToHero ? "bg-teal-100 text-teal-700 ring-1 ring-teal-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Hero Carousel
            </button>
            <button
              type="button"
              onClick={() => setAddingToHero(false)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                !addingToHero ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Featured Section
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search treks by name or region..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {availableTreks.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="text-sm text-slate-400">
                {search
                  ? "No treks match your search."
                  : `All treks are already added to the ${addingToHero ? "Hero Carousel" : "Featured Section"}.`}
              </p>
            </div>
          ) : (
            availableTreks.slice(0, 20).map((trek) => (
              <button
                key={trek.id}
                type="button"
                onClick={() => addTrek(trek.id)}
                className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-left transition-all hover:border-teal-300 hover:bg-teal-50/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">
                  🏔️
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{trek.title}</p>
                  <p className="text-xs text-slate-400">
                    {trek.duration}d · {trek.region} · {formatPrice(trek.price)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">
                      {trek.difficulty}
                    </span>
                    {trek._count && (
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                        <Star className="h-3 w-3" /> {trek._count.reviews} reviews
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    addingToHero
                      ? "bg-teal-100 text-teal-700"
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    + {addingToHero ? "Carousel" : "Featured"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
        {availableTreks.length > 20 && (
          <p className="mt-2 text-center text-xs text-slate-400">
            Showing 20 of {availableTreks.length} treks. Use search to narrow results.
          </p>
        )}
      </section>

      {/* ====================== SECTION HEADINGS ====================== */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Section Headings &amp; Descriptions</h2>
        <p className="mt-1 text-xs text-slate-400">
          Customize the heading and short description for each homepage section.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Featured Treks */}
          <div>
            <label className="block text-xs font-medium text-slate-500">Featured Treks — Heading</label>
            <input name="featuredTreksHeading" defaultValue={sectionContent.featuredTreksHeading} placeholder="Featured Treks"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Featured Treks — Description</label>
            <input name="featuredTreksDescription" defaultValue={sectionContent.featuredTreksDescription} placeholder="Handpicked adventures..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>

          {/* Best Selling */}
          <div>
            <label className="block text-xs font-medium text-slate-500">Best Selling Treks — Heading</label>
            <input name="bestSellingTreksHeading" defaultValue={sectionContent.bestSellingTreksHeading} placeholder="Best Selling Treks"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Best Selling Treks — Description</label>
            <input name="bestSellingTreksDescription" defaultValue={sectionContent.bestSellingTreksDescription} placeholder="Most popular treks..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>

          {/* Top Rated */}
          <div>
            <label className="block text-xs font-medium text-slate-500">Top Rated Treks — Heading</label>
            <input name="topRatedTreksHeading" defaultValue={sectionContent.topRatedTreksHeading} placeholder="Top Rated Treks"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Top Rated Treks — Description</label>
            <input name="topRatedTreksDescription" defaultValue={sectionContent.topRatedTreksDescription} placeholder="Highest rated adventures..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>

          {/* Reviews */}
          <div>
            <label className="block text-xs font-medium text-slate-500">Reviews Section — Heading</label>
            <input name="reviewsHeading" defaultValue={sectionContent.reviewsHeading} placeholder="What Our Trekkers Say"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Reviews Section — Description</label>
            <input name="reviewsDescription" defaultValue={sectionContent.reviewsDescription} placeholder="Real experiences..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>

          {/* Blog */}
          <div>
            <label className="block text-xs font-medium text-slate-500">Blog Section — Heading</label>
            <input name="blogHeading" defaultValue={sectionContent.blogHeading} placeholder="Latest from Our Blog"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Blog Section — Description</label>
            <input name="blogDescription" defaultValue={sectionContent.blogDescription} placeholder="Trekking tips and stories..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-xs font-medium text-slate-500">Contact Section — Heading</label>
            <input name="contactHeading" defaultValue={contactContent.contactHeading} placeholder="Ready for Your Himalayan Adventure?"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Contact Section — Description</label>
            <input name="contactDescription" defaultValue={contactContent.contactDescription} placeholder="Have a question about a trek, need help planning your itinerary, or ready to book?"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
        </div>
      </section>

      {/* ====================== WHY CHOOSE US ====================== */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Why Choose Us Section</h2>
            <p className="mt-1 text-xs text-slate-400">Manage the Why Choose Us section content and items.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" name="whyChooseUsEnabled" defaultChecked={whyChooseUsContent.whyChooseUsEnabled}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            Show section
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-500">Subtitle</label>
            <input name="whyChooseUsSubtitle" defaultValue={whyChooseUsContent.whyChooseUsSubtitle} placeholder="Discover the Difference"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Heading</label>
            <input name="whyChooseUsHeading" defaultValue={whyChooseUsContent.whyChooseUsHeading} placeholder="Why Trek With Us?"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500">Background Image URL</label>
            <input name="whyChooseUsBgImage" defaultValue={whyChooseUsContent.whyChooseUsBgImage} placeholder="/images/home/why-choose-us-bg.png"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100 font-mono text-xs" />
          </div>
        </div>

        {/* Why Choose Us Items */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</h3>
            <button type="button" onClick={addWhyChooseItem}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors">
              <Plus className="h-3 w-3" /> Add Item
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {whyChooseItems.map((item, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="flex flex-col gap-1 pt-1">
                  <GripVertical className="h-4 w-4 text-slate-300" />
                </div>
                <div className="flex-1 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase">Icon</label>
                    <select value={item.icon} onChange={(e) => updateWhyChooseItem(index, "icon", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100">
                      {AVAILABLE_ICONS.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase">Title</label>
                    <input value={item.title} onChange={(e) => updateWhyChooseItem(index, "title", e.target.value)}
                      placeholder="Item title"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
                  </div>
                  <div className="flex items-end gap-1">
                    <div className="flex-1">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase">Description</label>
                      <input value={item.description} onChange={(e) => updateWhyChooseItem(index, "description", e.target.value)}
                        placeholder="Item description"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
                    </div>
                    <button type="button" onClick={() => removeWhyChooseItem(index)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Home Settings"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
