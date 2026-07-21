"use client";

import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Minus, Plus, Users, Calendar, ChevronDown, ChevronUp, Package } from "lucide-react";

interface PricingTier {
  groupSize: string;
  pricePerPerson: number;
}

interface Addon {
  title: string;
  description: string;
  unit: string;
  pricePerUnit: number;
}

interface AvailableDate {
  startDate: string;
  seatsLeft: number;
}

interface PricingCalculatorProps {
  trekSlug: string;
  basePrice: number;
  duration: number;
  pricingTiers: PricingTier[];
  addons?: Addon[];
  availableDates?: AvailableDate[];
}

function parseTierRange(label: string): { min: number; max: number } {
  const match = label.match(/(\d+)\s*-\s*(\d+)/);
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
  const single = label.match(/(\d+)/);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return { min: 1, max: 1 };
}

function getPriceForGroupSize(tiers: PricingTier[], groupSize: number): number {
  for (const tier of tiers) {
    const range = parseTierRange(tier.groupSize);
    if (groupSize >= range.min && groupSize <= range.max) {
      return tier.pricePerPerson;
    }
  }
  if (tiers.length > 0) {
    return tiers[tiers.length - 1].pricePerPerson;
  }
  return 0;
}

// Renders the tooltip into document.body via a portal, positioned from the
// trigger's bounding rect — this means it's never clipped by an ancestor's
// overflow: hidden/auto (which is what was cutting it off before).
function PortalTooltip({
  anchorRect,
  children,
}: {
  anchorRect: DOMRect;
  children: React.ReactNode;
}) {
  const width = 256; // w-64
  let left = anchorRect.left;
  // keep it on-screen horizontally
  if (left + width > window.innerWidth - 8) {
    left = window.innerWidth - width - 8;
  }
  const top = anchorRect.top - 8; // gap above the trigger

  return createPortal(
    <div
      className="fixed z-50 w-64 -translate-y-full rounded-lg border bg-white px-3 py-2 text-xs shadow-lg whitespace-normal pointer-events-none"
      style={{ left, top, borderColor: "var(--color-border)", color: "var(--color-text)" }}
    >
      {children}
      <div
        className="absolute left-3 top-full -mt-px h-2 w-2 rotate-45 border-r border-b bg-white"
        style={{ borderColor: "var(--color-border)" }}
      />
    </div>,
    document.body
  );
}

function AddonTitle({ title, description }: { title: string; description: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLParagraphElement>(null);

  return (
    <>
      <p
        ref={ref}
        onMouseEnter={() => ref.current && setRect(ref.current.getBoundingClientRect())}
        onMouseLeave={() => setRect(null)}
        className="text-sm font-medium truncate cursor-help underline decoration-dotted underline-offset-2"
        style={{ color: "var(--color-foreground)" }}
      >
        {title}
      </p>
      {rect && <PortalTooltip anchorRect={rect}>{description}</PortalTooltip>}
    </>
  );
}

export function PricingCalculator({
  trekSlug,
  basePrice,
  duration,
  pricingTiers,
  addons = [],
  availableDates = [],
}: PricingCalculatorProps) {
  const [travelers, setTravelers] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [showGroupPricing, setShowGroupPricing] = useState(false);
  const [addonQtys, setAddonQtys] = useState<number[]>(addons.map(() => 0));

  const pricePerPerson = useMemo(
    () => getPriceForGroupSize(pricingTiers, travelers),
    [pricingTiers, travelers]
  );

  const trekTotal = pricePerPerson * travelers;

  const addonTotals = useMemo(
    () => addons.map((a, i) => a.pricePerUnit * (addonQtys[i] || 0)),
    [addons, addonQtys]
  );

  const grandTotal = trekTotal + addonTotals.reduce((sum, t) => sum + t, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Travelers + Start Date — merged row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Traveler count */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Users className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
              Travelers
            </label>
            <div
              className="mt-1.5 flex items-center justify-between rounded-lg border px-2.5 py-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-alt)" }}
            >
              <button
                type="button"
                onClick={() => setTravelers(Math.max(1, travelers - 1))}
                disabled={travelers <= 1}
                className="flex h-6 w-6 items-center justify-center rounded-md border bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-base font-bold tabular-nums" style={{ color: "var(--color-foreground)" }}>
                {travelers}
              </span>
              <button
                type="button"
                onClick={() => setTravelers(Math.min(20, travelers + 1))}
                disabled={travelers >= 20}
                className="flex h-6 w-6 items-center justify-center rounded-md border bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
              Start Date
            </label>
            <div className="mt-1.5">
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border px-2.5 py-2 text-sm focus:outline-none focus:ring-1"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface-alt)",
                  color: "var(--color-foreground)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Total breakdown */}
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-alt)" }}
        >
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--color-text)" }}>
              Trek ({travelers} &times; ${pricePerPerson})
            </span>
            <span className="font-semibold tabular-nums" style={{ color: "var(--color-foreground)" }}>
              ${trekTotal.toLocaleString()}
            </span>
          </div>
          {addonTotals.map((total, i) =>
            total > 0 ? (
              <div key={i} className="mt-1 flex items-center justify-between text-sm">
                <span style={{ color: "var(--color-text)" }}>
                  {addons[i].title} &times; {addonQtys[i]}
                </span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--color-foreground)" }}>
                  +${total.toLocaleString()}
                </span>
              </div>
            ) : null
          )}
          <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-base font-bold" style={{ color: "var(--color-foreground)" }}>
              Total
            </span>
            <span className="text-xl font-bold tabular-nums" style={{ color: "var(--color-primary)" }}>
              ${grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Group pricing — collapsible, scrolls after 2 rows */}
        {pricingTiers.length > 0 && (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
            <button
              type="button"
              onClick={() => setShowGroupPricing(!showGroupPricing)}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide hover:bg-slate-50"
              style={{ color: "var(--color-text-muted)" }}
            >
              Group Pricing
              {showGroupPricing ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showGroupPricing && (
              <div
                className="border-t px-3 py-2 space-y-1 max-h-[88px] overflow-y-auto"
                style={{ borderColor: "var(--color-border)" }}
              >
                {pricingTiers.map((tier, i) => {
                  const isActive = getPriceForGroupSize(pricingTiers, travelers) === tier.pricePerPerson;
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs ${
                        isActive ? "bg-teal-50" : "bg-white"
                      }`}
                      style={{ borderColor: isActive ? "var(--color-primary-light)" : "var(--color-border)" }}
                    >
                      <span style={{ color: "var(--color-text)" }}>{tier.groupSize}</span>
                      <span
                        className={`font-semibold ${isActive ? "text-teal-700" : ""}`}
                        style={{ color: isActive ? "var(--color-primary)" : "var(--color-foreground)" }}
                      >
                        ${tier.pricePerPerson.toLocaleString()}/pp
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add-ons — scrollable, portal tooltip so it isn't clipped by overflow-y-auto */}
        {addons.length > 0 && (
          <div>
            <label
              className="flex items-center gap-1.5 text-sm font-semibold mb-2"
              style={{ color: "var(--color-secondary)" }}
            >
              <Package className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              Add-ons
            </label>
            <div className="space-y-1.5 max-h-[124px] overflow-y-auto pr-1">
              {addons.map((addon, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <AddonTitle title={addon.title} description={addon.description} />
                    <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                      ${addon.pricePerUnit}/{addon.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setAddonQtys((prev) => prev.map((q, idx) => (idx === i ? Math.max(0, q - 1) : q)))
                      }
                      disabled={(addonQtys[i] || 0) <= 0}
                      className="flex h-6 w-6 items-center justify-center rounded-md border bg-white text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold tabular-nums" style={{ color: "var(--color-foreground)" }}>
                      {addonQtys[i] || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddonQtys((prev) => prev.map((q, idx) => (idx === i ? q + 1 : q)))}
                      className="flex h-6 w-6 items-center justify-center rounded-md border bg-white text-slate-500 hover:bg-slate-100"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span
                    className="w-14 text-right text-sm font-semibold tabular-nums shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  >
                    ${addonTotals[i].toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book button */}
        <Link
          href={`/book/${trekSlug}?travelers=${travelers}${startDate ? `&startDate=${startDate}` : ""}&addons=${encodeURIComponent(
            JSON.stringify(
              addons.filter((_, i) => addonQtys[i] > 0).map((a, i) => ({ title: a.title, qty: addonQtys[i], pricePerUnit: a.pricePerUnit }))
            )
          )}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Book Now &mdash; ${grandTotal.toLocaleString()}
        </Link>

        <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          No payment required yet
        </p>
      </div>
    </div>
  );
}