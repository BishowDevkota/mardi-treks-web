"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createTrek, updateTrek, deleteTrek } from "./actions";
import { TrekSection } from "@/components/admin/trek-sections/types";
import { createDefaultSection } from "@/components/admin/trek-sections/types";
import { SectionRenderer } from "@/components/admin/trek-sections/SectionRenderer";
import { Plus, Save, Loader2, ArrowUp, ArrowDown } from "lucide-react";

// ─── Predefined section types the user can add ──────────────────────
const ADDABLE_SECTION_TYPES: { type: TrekSection["type"]; label: string; icon: string }[] = [
  { type: "highlights", label: "Highlights", icon: "⭐" },
  { type: "itinerary", label: "Itinerary", icon: "🗺️" },
  { type: "inclusions", label: "Inclusions", icon: "✅" },
  { type: "exclusions", label: "Exclusions", icon: "❌" },
  { type: "pricing", label: "Pricing Tiers", icon: "💰" },
  { type: "dates", label: "Available Dates", icon: "📅" },
  { type: "faqs", label: "FAQs", icon: "❓" },
  { type: "custom", label: "Custom Section", icon: "📄" },
];

export function TrekForm({ mode, trek }: { mode: "create" | "edit"; trek?: any }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // ── Sections state ────────────────────────────────────────────────
  const [sections, setSections] = useState<TrekSection[]>(() => {
    // Always include these default sections in order
    const defaults: TrekSection["type"][] = ["details", "overview", "map", "seo"];
    const existing = defaults.map((t) => createDefaultSection(t, trek));

    // Restore non-default sections from trek data if editing
    if (trek) {
      const extras: TrekSection["type"][] = [
        "highlights", "itinerary", "inclusions", "exclusions",
        "pricing", "dates", "faqs",
      ];
      for (const t of extras) {
        const def = createDefaultSection(t, trek);
        const hasData = (arr: any[]) => arr.length > 0;
        let shouldInclude = false;
        if (t === "highlights") shouldInclude = hasData(def.data.items);
        else if (t === "itinerary") shouldInclude = hasData(def.data.items);
        else if (t === "inclusions") shouldInclude = hasData(def.data.items);
        else if (t === "exclusions") shouldInclude = hasData(def.data.items);
        else if (t === "pricing") shouldInclude = hasData(def.data.items);
        else if (t === "dates") shouldInclude = hasData(def.data.items);
        else if (t === "faqs") shouldInclude = hasData(def.data.items);
        if (shouldInclude) existing.push(def);
      }

      // Restore custom sections (stored as JSON in the trek)
      if ((trek as any).customSections) {
        try {
          const cs = JSON.parse((trek as any).customSections);
          if (Array.isArray(cs)) existing.push(...cs);
        } catch {}
      }
    }

    return existing;
  });

  // ── Section mutations ─────────────────────────────────────────────
  const updateSection = useCallback((id: string, data: any) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, data } : s)));
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setSections((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const addSection = useCallback((type: TrekSection["type"]) => {
    const section = createDefaultSection(type);
    // Insert before SEO (which should be last)
    setSections((prev) => {
      const seoIdx = prev.findIndex((s) => s.type === "seo");
      const idx = seoIdx >= 0 ? seoIdx : prev.length;
      return [...prev.slice(0, idx), section, ...prev.slice(idx)];
    });
    setShowAddMenu(false);
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Extract data from sections
    const details = sections.find((s) => s.type === "details")?.data || {};
    const overview = sections.find((s) => s.type === "overview")?.data || {};
    const highlights = sections.find((s) => s.type === "highlights")?.data || { items: [] };
    const itinerary = sections.find((s) => s.type === "itinerary")?.data || { items: [] };
    const inclusions = sections.find((s) => s.type === "inclusions")?.data || { items: [] };
    const exclusions = sections.find((s) => s.type === "exclusions")?.data || { items: [] };
    const pricing = sections.find((s) => s.type === "pricing")?.data || { items: [] };
    const dates = sections.find((s) => s.type === "dates")?.data || { items: [] };
    const faqs = sections.find((s) => s.type === "faqs")?.data || { items: [] };
    const mapData = sections.find((s) => s.type === "map")?.data || {};
    const seo = sections.find((s) => s.type === "seo")?.data || {};

    // Custom sections
    const customSections = sections.filter((s) => s.type === "custom");

    const fd = new FormData();
    fd.set("title", details.title || "");
    fd.set("slug", details.slug || "");
    fd.set("subtitle", details.subtitle || "");
    fd.set("heroBadge", details.heroBadge || "");
    fd.set("heroSubtitle", details.heroSubtitle || "");
    fd.set("heroImage", details.heroImage || "");
    fd.set("price", String(details.price || 0));
    fd.set("duration", String(details.duration || 0));
    fd.set("maxGroupSize", String(details.maxGroupSize || 12));
    fd.set("difficulty", details.difficulty || "moderate");
    fd.set("region", details.region || "annapurna");
    fd.set("status", details.status || "draft");
    fd.set("overview", overview.content || "");
    fd.set("highlights", JSON.stringify(highlights.items));
    fd.set("itinerary", JSON.stringify(itinerary.items));
    fd.set("inclusions", JSON.stringify(inclusions.items));
    fd.set("exclusions", JSON.stringify(exclusions.items));
    fd.set("pricingTiers", JSON.stringify(pricing.items));
    fd.set("availableDates", JSON.stringify(dates.items));
    fd.set("faqs", JSON.stringify(faqs.items));
    fd.set("metaTitle", seo.metaTitle || "");
    fd.set("metaDescription", seo.metaDescription || "");
    fd.set("ogImage", seo.ogImage || "");
    fd.set("centerLat", String(mapData.centerLat || 28.5));
    fd.set("centerLng", String(mapData.centerLng || 83.9));
    fd.set("zoom", String(mapData.zoom || 7));
    fd.set("pitch", String(mapData.pitch || 45));
    fd.set("geoJsonUrl", mapData.geoJsonUrl || "");
    fd.set("geoJsonData", mapData.geoJsonData || "");
    fd.set("waypoints", JSON.stringify(mapData.waypoints || []));
    fd.set("customSections", JSON.stringify(customSections));

    // Section order — store so frontend can render in correct order
    fd.set("sectionOrder", JSON.stringify(sections.filter((s) => s.visible).map((s) => s.id)));

    try {
      if (mode === "create") await createTrek(fd);
      else if (trek) await updateTrek(trek.id, fd);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">⚠️ {error}</div>
      )}

      {/* Reorderable Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Page Builder</h2>
            <p className="text-xs text-slate-400">Drag or use arrows to reorder sections. Click 👁️ to hide.</p>
          </div>
          <div className="relative">
            <button type="button" onClick={() => setShowAddMenu(!showAddMenu)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md">
              <Plus className="h-3.5 w-3.5" /> Add Section
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {ADDABLE_SECTION_TYPES.map((item) => (
                  <button key={item.type} type="button" onClick={() => addSection(item.type)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {sections.map((section, i) => (
          <SectionRenderer
            key={section.id}
            section={section}
            index={i}
            total={sections.length}
            onChange={updateSection}
            onToggleVisibility={toggleVisibility}
            onRemove={removeSection}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="sticky bottom-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">Ready to publish?</p>
          <p className="text-xs text-slate-400">{sections.filter((s) => s.visible).length} sections visible</p>
        </div>
        <button type="button" onClick={() => router.push("/admin/treks")}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : mode === "create" ? "Create Trek" : "Save Changes"}
        </button>
        {mode === "edit" && trek && (
          <button type="button"
            onClick={async () => { if (confirm("Delete this trek permanently?")) { await deleteTrek(trek.id); } }}
            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            🗑️ Delete
          </button>
        )}
      </div>
    </form>
  );
}
