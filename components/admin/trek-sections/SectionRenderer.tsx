"use client";

import { useState } from "react";
import { GripVertical, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { TrekSection, DetailsData, OverviewData, HighlightsData, ItineraryData, InExData, PricingData, DatesData, FaqsData, MapData, SeoData, CustomData } from "./types";
import { ImageUpload } from "./ImageUpload";
import { MapPreview } from "./MapPreview";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/admin/RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false }
);

// ─── Props ───────────────────────────────────────────────────────────
interface Props {
  section: TrekSection;
  index: number;
  total: number;
  onChange: (id: string, data: any) => void;
  onToggleVisibility: (id: string) => void;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

// ─── Section wrapper with controls ──────────────────────────────────
function SectionShell({ section, index, total, onToggleVisibility, onRemove, onMoveUp, onMoveDown, children }: Props & { children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all ${section.visible ? "border-slate-200" : "border-slate-100 bg-slate-50/50 opacity-60"}`}>
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <GripVertical className="h-4 w-4 shrink-0 text-slate-300 cursor-grab" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 min-w-[80px]">{section.label}</span>
        {section.type === "custom" && (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">Custom</span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" onClick={() => onMoveUp(index)} disabled={index === 0}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onMoveDown(index)} disabled={index === total - 1}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onToggleVisibility(section.id)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={() => onRemove(section.id)}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* Body */}
      {section.visible && <div className="p-4">{children}</div>}
    </div>
  );
}

// ─── Field helper ───────────────────────────────────────────────────
function Field({ label, children, slim }: { label: string; children: React.ReactNode; slim?: boolean }) {
  return (
    <div className={slim ? "" : "space-y-1"}>
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

// ─── Add button (dashed, inline) ────────────────────────────────────
function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600">
      + {label}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SECTION RENDERERS
// ═════════════════════════════════════════════════════════════════════

// ─── Details ────────────────────────────────────────────────────────
function DetailsSection({ data, onChange }: { data: DetailsData; onChange: (d: DetailsData) => void }) {
  const set = (field: keyof DetailsData, value: any) => onChange({ ...data, [field]: value });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Title *"><input value={data.title} onChange={(e) => set("title", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Field>
      <Field label="Slug *"><input value={data.slug} onChange={(e) => set("slug", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono" /></Field>
      <Field label="Subtitle"><input value={data.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Field>
      <Field label="Hero Badge"><input value={data.heroBadge} onChange={(e) => set("heroBadge", e.target.value)} placeholder="Best Seller" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Field>
      <Field label="Hero Subtitle"><input value={data.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Field>
      <Field label="Base Price (USD) *">
        <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
          <input type="number" value={data.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-sm" /></div>
      </Field>
      <Field label="Duration (days) *"><input type="number" value={data.duration} onChange={(e) => set("duration", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Field>
      <Field label="Max Group Size"><input type="number" value={data.maxGroupSize} onChange={(e) => set("maxGroupSize", parseInt(e.target.value) || 12)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></Field>
      <Field label="Difficulty">
        <select value={data.difficulty} onChange={(e) => set("difficulty", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {["easy", "moderate", "challenging", "difficult", "extreme"].map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Region">
        <select value={data.region} onChange={(e) => set("region", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {["everest","annapurna","langtang","mustang","manaslu","kanchenjunga","far-west","other"].map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select value={data.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select>
      </Field>
      <div className="sm:col-span-2">
        <ImageUpload value={data.heroImage} onChange={(id) => set("heroImage", id)} label="Hero Image" />
      </div>
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────
function OverviewSection({ data, onChange }: { data: OverviewData; onChange: (d: OverviewData) => void }) {
  return <RichTextEditor content={data.content} onChange={(html) => onChange({ content: html })} placeholder="Describe the trek..." />;
}

// ─── Highlights ─────────────────────────────────────────────────────
function HighlightsSection({ data, onChange }: { data: HighlightsData; onChange: (d: HighlightsData) => void }) {
  const items = data.items;
  const update = (i: number, field: string, val: string) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
    onChange({ items: next });
  };
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const add = () => onChange({ items: [...items, { icon: "", text: "" }] });

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No highlights yet.</p>}
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
          <input value={item.icon} onChange={(e) => update(i, "icon", e.target.value)} placeholder="Emoji 🏔️" className="w-20 shrink-0 rounded border border-slate-200 px-2 py-1.5 text-sm" />
          <input value={item.text} onChange={(e) => update(i, "text", e.target.value)} placeholder="Highlight text" className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
          <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <AddBtn onClick={add} label="Add highlight" />
    </div>
  );
}

// ─── Itinerary ──────────────────────────────────────────────────────
function ItinerarySection({ data, onChange }: { data: ItineraryData; onChange: (d: ItineraryData) => void }) {
  const items = data.items;
  const update = (i: number, field: string, val: any) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
    onChange({ items: next });
  };
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const add = () => onChange({ items: [...items, { dayNumber: items.length + 1, title: "", description: "", elevation: "", accommodation: "" }] });

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No itinerary days yet.</p>}
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="rounded bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-700">Day {item.dayNumber || i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input type="number" value={item.dayNumber || i + 1} onChange={(e) => update(i, "dayNumber", parseInt(e.target.value) || i + 1)} className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
            <input value={item.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="Title" className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
            <textarea rows={2} value={item.description} onChange={(e) => update(i, "description", e.target.value)} placeholder="Description" className="col-span-2 rounded border border-slate-200 px-2 py-1.5 text-sm" />
            <input value={item.elevation} onChange={(e) => update(i, "elevation", e.target.value)} placeholder="Elevation (e.g. 2,800m)" className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
            <input value={item.accommodation} onChange={(e) => update(i, "accommodation", e.target.value)} placeholder="Accommodation" className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
          </div>
        </div>
      ))}
      <AddBtn onClick={add} label="Add day" />
    </div>
  );
}

// ─── Inclusions / Exclusions (shared) ───────────────────────────────
function InExSection({ data, onChange, prefix }: { data: InExData; onChange: (d: InExData) => void; prefix: string }) {
  const items = data.items;
  const update = (i: number, v: string) => onChange({ items: items.map((item, idx) => idx === i ? v : item) });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const add = () => onChange({ items: [...items, ""] });

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="shrink-0 text-xs">{prefix === "inclusions" ? "✓" : "✗"}</span>
          <input value={item} onChange={(e) => update(i, e.target.value)} placeholder={`Add ${prefix.slice(0, -1)}...`} className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
          <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
        </div>
      ))}
      <AddBtn onClick={add} label={`Add ${prefix.slice(0, -1)}`} />
    </div>
  );
}

// ─── Pricing Tiers ──────────────────────────────────────────────────
function PricingSection({ data, onChange }: { data: PricingData; onChange: (d: PricingData) => void }) {
  const items = data.items;
  const update = (i: number, field: string, val: any) => onChange({ items: items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const add = () => onChange({ items: [...items, { groupSize: "", pricePerPerson: 0 }] });

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
          <input value={item.groupSize} onChange={(e) => update(i, "groupSize", e.target.value)} placeholder="e.g. 1-2 people" className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
          <div className="relative w-32"><span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input type="number" value={item.pricePerPerson} onChange={(e) => update(i, "pricePerPerson", parseFloat(e.target.value) || 0)} className="w-full rounded border border-slate-200 py-1.5 pl-6 pr-2 text-sm" /></div>
          <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <AddBtn onClick={add} label="Add pricing tier" />
    </div>
  );
}

// ─── Available Dates ────────────────────────────────────────────────
function DatesSection({ data, onChange }: { data: DatesData; onChange: (d: DatesData) => void }) {
  const items = data.items;
  const update = (i: number, field: string, val: any) => onChange({ items: items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const add = () => onChange({ items: [...items, { startDate: "", seatsLeft: 12 }] });

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
          <input type="date" value={item.startDate} onChange={(e) => update(i, "startDate", e.target.value)} className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
          <input type="number" value={item.seatsLeft} onChange={(e) => update(i, "seatsLeft", parseInt(e.target.value) || 0)} placeholder="Seats" className="w-24 rounded border border-slate-200 px-2 py-1.5 text-sm" />
          <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <AddBtn onClick={add} label="Add date" />
    </div>
  );
}

// ─── FAQs ───────────────────────────────────────────────────────────
function FaqsSection({ data, onChange }: { data: FaqsData; onChange: (d: FaqsData) => void }) {
  const items = data.items;
  const update = (i: number, field: string, val: string) => onChange({ items: items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });
  const add = () => onChange({ items: [...items, { question: "", answer: "" }] });

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400">Q{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
          </div>
          <div className="space-y-1.5">
            <input value={item.question} onChange={(e) => update(i, "question", e.target.value)} placeholder="Question" className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
            <textarea rows={2} value={item.answer} onChange={(e) => update(i, "answer", e.target.value)} placeholder="Answer" className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
          </div>
        </div>
      ))}
      <AddBtn onClick={add} label="Add FAQ" />
    </div>
  );
}

// ─── Map ────────────────────────────────────────────────────────────
function MapSection({ data, onChange }: { data: MapData; onChange: (d: MapData) => void }) {
  const set = (field: keyof MapData, value: any) => onChange({ ...data, [field]: value });

  const waypoints = Array.isArray(data.waypoints) ? data.waypoints : [];
  const addWaypoint = () => set("waypoints", [...waypoints, { lng: 0, lat: 0, label: "" }]);
  const removeWp = (i: number) => set("waypoints", waypoints.filter((_, idx) => idx !== i));

  // Parse "lat, lng" string — extracts both numbers from a single input
  function parseCoord(raw: string) {
    const parts = raw.split(",").map((s) => parseFloat(s.trim()));
    return { lat: parts[0] && !isNaN(parts[0]) ? parts[0] : 0, lng: parts[1] && !isNaN(parts[1]) ? parts[1] : 0 };
  }
  function coordValue(wp: { lat: number; lng: number }) {
    return wp.lat || wp.lng ? `${wp.lat}, ${wp.lng}` : "";
  }
  function updateWpCoord(i: number, raw: string) {
    const { lat, lng } = parseCoord(raw);
    const next = waypoints.map((wp, idx) => (idx === i ? { ...wp, lat, lng } : wp));
    set("waypoints", next);
  }

  return (
    <div className="space-y-3">
      <MapPreview centerLat={data.centerLat} centerLng={data.centerLng} zoom={data.zoom} pitch={data.pitch} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Center Lat" slim><input type="number" step="any" value={data.centerLat} onChange={(e) => set("centerLat", parseFloat(e.target.value) || 0)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" /></Field>
        <Field label="Center Lng" slim><input type="number" step="any" value={data.centerLng} onChange={(e) => set("centerLng", parseFloat(e.target.value) || 0)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" /></Field>
        <Field label="Zoom" slim><input type="number" step="0.1" value={data.zoom} onChange={(e) => set("zoom", parseFloat(e.target.value) || 5)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" /></Field>
        <Field label="Pitch" slim><input type="number" step="1" value={data.pitch} onChange={(e) => set("pitch", parseFloat(e.target.value) || 45)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" /></Field>
      </div>
      {/* GeoJSON route upload */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-500">Actual Trek Route (GeoJSON)</label>
          <span className="text-[10px] text-slate-400">If empty, a dashed straight line is shown</span>
        </div>
        <GeoJsonUpload
          value={data.geoJsonUrl}
          onChange={(url) => set("geoJsonUrl", url)}
          onContentChange={(content) => set("geoJsonData", content)}
        />
      </div>

      {/* Waypoints */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">Route Waypoints</label>
        <div className="space-y-1.5">
          {waypoints.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No waypoints. Add points along the trek route.</p>
          )}
          {waypoints.map((wp, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-2">
              <div className="flex items-start gap-1.5">
                <span className="mt-1.5 text-xs font-bold text-slate-400 w-5 shrink-0">{i + 1}.</span>
                <input type="text" value={coordValue(wp)} placeholder="27.70, 85.37"
                  onChange={(e) => updateWpCoord(i, e.target.value)}
                  className="w-44 rounded border border-slate-200 px-2 py-1.5 text-sm font-mono" />
                <input type="text" value={wp.label} placeholder="Label (e.g. Lukla)"
                  onChange={(e) => {
                    const next = waypoints.map((w, idx) => (idx === i ? { ...w, label: e.target.value } : w));
                    set("waypoints", next);
                  }}
                  className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
                <button type="button" onClick={() => removeWp(i)}
                  className="mt-1 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea rows={1} value={wp.description || ""} placeholder="Description (shown on hover)"
                onChange={(e) => {
                  const next = waypoints.map((w, idx) => (idx === i ? { ...w, description: e.target.value } : w));
                  set("waypoints", next);
                }}
                className="mt-1.5 w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 resize-none" />
            </div>
          ))}
          <AddBtn onClick={addWaypoint} label="Add waypoint" />
        </div>
      </div>
    </div>
  );
}

// ─── SEO ────────────────────────────────────────────────────────────
function SeoSection({ data, onChange }: { data: SeoData; onChange: (d: SeoData) => void }) {
  const set = (field: keyof SeoData, value: any) => onChange({ ...data, [field]: value });
  return (
    <div className="space-y-3">
      <Field label="Meta Title"><input value={data.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" /></Field>
      <Field label="Meta Description"><textarea rows={3} value={data.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" /></Field>
      <ImageUpload value={data.ogImage} onChange={(id) => set("ogImage", id)} label="OG Image (social sharing)" />
    </div>
  );
}

// ─── Custom Section ─────────────────────────────────────────────────
function CustomSection({ data, onChange }: { data: CustomData; onChange: (d: CustomData) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading"><input value={data.heading} onChange={(e) => onChange({ ...data, heading: e.target.value })} placeholder="Section heading" className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" /></Field>
      <Field label="Content"><RichTextEditor content={data.content} onChange={(html) => onChange({ ...data, content: html })} placeholder="Write your section content..." /></Field>
    </div>
  );
}

// ─── GeoJSON Upload ──────────────────────────────────────────────────
function GeoJsonUpload({ value, onChange, onContentChange }: {
  value: string;
  onChange: (url: string) => void;
  onContentChange: (content: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", "mardi-treks/routes");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onChange(data.url);
      if (data.content) onContentChange(data.content);
    } catch {}
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-2">
          <span className="text-xs text-teal-700 truncate flex-1">✅ Route loaded</span>
          <button type="button" onClick={() => { onChange(""); onContentChange(null); }}
            className="text-[11px] text-teal-600 hover:text-teal-800 font-medium">Remove</button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload .geojson or .json file"}
          <input type="file" accept=".geojson,.json" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400">Or paste URL:</span>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/route.geojson"
          className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs font-mono" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN RENDERER
// ═════════════════════════════════════════════════════════════════════
export function SectionRenderer(props: Props) {
  const { section, onChange } = props;
  const upd = (data: any) => onChange(section.id, data);

  const content = (() => {
    switch (section.type) {
      case "details":    return <DetailsSection data={section.data} onChange={upd} />;
      case "overview":   return <OverviewSection data={section.data} onChange={upd} />;
      case "highlights": return <HighlightsSection data={section.data} onChange={upd} />;
      case "itinerary":  return <ItinerarySection data={section.data} onChange={upd} />;
      case "inclusions": return <InExSection data={section.data} onChange={upd} prefix="inclusions" />;
      case "exclusions": return <InExSection data={section.data} onChange={upd} prefix="exclusions" />;
      case "pricing":    return <PricingSection data={section.data} onChange={upd} />;
      case "dates":      return <DatesSection data={section.data} onChange={upd} />;
      case "faqs":       return <FaqsSection data={section.data} onChange={upd} />;
      case "map":        return <MapSection data={section.data} onChange={upd} />;
      case "seo":        return <SeoSection data={section.data} onChange={upd} />;
      case "custom":     return <CustomSection data={section.data} onChange={upd} />;
      default:           return <p className="text-xs text-slate-400">Unknown section type</p>;
    }
  })();

  return <SectionShell {...props}>{content}</SectionShell>;
}
