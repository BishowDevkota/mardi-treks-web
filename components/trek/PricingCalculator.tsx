"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Minus, Plus, Users, ChevronDown, ChevronUp, Package } from "lucide-react";

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

interface PricingCalculatorProps {
  trekSlug: string;
  basePrice: number;
  duration: number;
  pricingTiers: PricingTier[];
  addons?: Addon[];
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

export function PricingCalculator({
  trekSlug,
  basePrice,
  duration,
  pricingTiers,
  addons = [],
}: PricingCalculatorProps) {
  const [travelers, setTravelers] = useState(1);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-4">
        <h3 className="text-lg font-bold text-white">Price Calculator</h3>
        <p className="text-xs text-teal-100">
          ${basePrice.toLocaleString()} / person &middot; {duration} days
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Traveler count */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Users className="h-4 w-4 text-teal-600" />
            Number of Travelers
          </label>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <button
              onClick={() => setTravelers(Math.max(1, travelers - 1))}
              disabled={travelers <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {travelers}
            </span>
            <button
              onClick={() => setTravelers(Math.min(20, travelers + 1))}
              disabled={travelers >= 20}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Total breakdown */}
        <div className="rounded-lg bg-teal-50/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Trek ({travelers} × ${pricePerPerson})</span>
            <span className="font-semibold text-slate-900">${trekTotal.toLocaleString()}</span>
          </div>
          {addonTotals.map((total, i) =>
            total > 0 ? (
              <div key={i} className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-600">{addons[i].title} × {addonQtys[i]}</span>
                <span className="font-semibold text-slate-900">+${total.toLocaleString()}</span>
              </div>
            ) : null
          )}
          <div className="mt-2 flex items-center justify-between border-t border-teal-200 pt-2">
            <span className="text-base font-bold text-slate-900">Total</span>
            <span className="text-xl font-bold text-teal-700">
              ${grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Group pricing — collapsible */}
        {pricingTiers.length > 0 && (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGroupPricing(!showGroupPricing)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Group Pricing
              {showGroupPricing ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showGroupPricing && (
              <div className="border-t border-slate-200 px-4 py-3 space-y-1.5">
                {pricingTiers.map((tier, i) => {
                  const isActive = getPriceForGroupSize(pricingTiers, travelers) === tier.pricePerPerson;
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors ${isActive ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`}>
                      <span className="text-slate-600">{tier.groupSize}</span>
                      <span className={`font-semibold ${isActive ? "text-teal-700" : "text-slate-800"}`}>
                        ${tier.pricePerPerson.toLocaleString()}/pp
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add-ons */}
        {addons.length > 0 && (
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-3">
              <Package className="h-4 w-4 text-teal-600" />
              Add-ons
            </label>
            <div className="space-y-2">
              {addons.map((addon, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="relative group/tooltip inline-block">
                      <p className="text-sm font-medium text-slate-900 truncate cursor-help underline decoration-dotted underline-offset-2 decoration-slate-300">{addon.title}</p>
                      <div className="absolute bottom-full left-0 mb-1.5 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10 whitespace-normal">
                        {addon.description}
                        <div className="absolute left-3 top-full -mt-px h-2 w-2 rotate-45 border-r border-b border-slate-200 bg-white"></div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">${addon.pricePerUnit}/{addon.unit}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAddonQtys((prev) => prev.map((q, idx) => (idx === i ? Math.max(0, q - 1) : q)))}
                      disabled={(addonQtys[i] || 0) <= 0}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-900 tabular-nums">
                      {addonQtys[i] || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddonQtys((prev) => prev.map((q, idx) => (idx === i ? q + 1 : q)))}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold text-teal-600 tabular-nums shrink-0">
                    ${addonTotals[i].toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book button */}
        <Link
          href={`/book/${trekSlug}?travelers=${travelers}&addons=${encodeURIComponent(JSON.stringify(addons.filter((_, i) => addonQtys[i] > 0).map((a, i) => ({ title: a.title, qty: addonQtys[i], pricePerUnit: a.pricePerUnit }))))}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          Book Now — ${grandTotal.toLocaleString()}
        </Link>

        <p className="text-center text-xs text-slate-400">No payment required yet</p>
      </div>
    </div>
  );
}
