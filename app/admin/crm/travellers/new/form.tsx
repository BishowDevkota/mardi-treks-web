"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Search, MapPin, Check, X, Clock, DollarSign } from "lucide-react";
import { createTraveller, updateTraveller } from "../../actions";

export function TravellerForm({
  traveller,
  treks,
  contacts,
  users,
}: {
  traveller: any | null;
  treks: { id: string; title: string; slug: string; duration: number; difficulty: string; price: number; region: string | null }[];
  contacts: { id: string; name: string; email: string | null }[];
  users: { id: string; name: string | null; email: string | null }[];
}) {
  const router = useRouter();
  const [selectedTrekIds, setSelectedTrekIds] = useState<string[]>(traveller?.completedTrekIds || []);
  const [trekSearch, setTrekSearch] = useState("");

  const filteredTreks = treks.filter(
    (t) =>
      t.title.toLowerCase().includes(trekSearch.toLowerCase()) ||
      t.region?.toLowerCase().includes(trekSearch.toLowerCase())
  );

  const toggleTrek = (trekId: string) => {
    setSelectedTrekIds((prev) =>
      prev.includes(trekId) ? prev.filter((id) => id !== trekId) : [...prev, trekId]
    );
  };

  const difficultyColor: Record<string, string> = {
    easy: "text-emerald-600 bg-emerald-50",
    moderate: "text-amber-600 bg-amber-50",
    challenging: "text-orange-600 bg-orange-50",
    difficult: "text-red-600 bg-red-50",
    extreme: "text-purple-600 bg-purple-50",
  };

  const selectedTreks = treks.filter((t) => selectedTrekIds.includes(t.id));

  return (
    <form
      action={async (formData) => {
        formData.set("completedTrekIds", JSON.stringify(selectedTrekIds));
        if (traveller) {
          await updateTraveller(traveller.id, formData);
        } else {
          await createTraveller(formData);
        }
        router.refresh();
      }}
      className="space-y-6"
    >
      {/* Basic Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Traveller Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name *</label>
            <input
              name="name"
              defaultValue={traveller?.name || ""}
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder="Traveller's full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={traveller?.email || ""}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder="traveller@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
            <input
              name="phone"
              defaultValue={traveller?.phone || ""}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder="+977-98..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nationality</label>
            <input
              name="nationality"
              defaultValue={traveller?.nationality || ""}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder="e.g. Nepalese"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Passport Number</label>
            <input
              name="passportNumber"
              defaultValue={traveller?.passportNumber || ""}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {/* Linking */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Link to Existing Records</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Link to CRM Contact</label>
            <select
              name="contactId"
              defaultValue={traveller?.contactId || ""}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Not linked</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Link to Website User</label>
            <select
              name="userId"
              defaultValue={traveller?.userId || ""}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Not linked</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Completed Treks Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Completed Treks</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedTrekIds.length} trek{selectedTrekIds.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>

        {/* Selected treks summary */}
        {selectedTreks.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedTreks.map((trek) => (
              <div
                key={trek.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
              >
                <MapPin className="h-3 w-3" />
                {trek.title}
                <button
                  type="button"
                  onClick={() => toggleTrek(trek.id)}
                  className="ml-0.5 hover:text-emerald-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search treks */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={trekSearch}
            onChange={(e) => setTrekSearch(e.target.value)}
            placeholder="Search treks to add..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* Trek list */}
        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
          {filteredTreks.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No treks found</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTreks.map((trek) => {
                const isSelected = selectedTrekIds.includes(trek.id);
                return (
                  <button
                    key={trek.id}
                    type="button"
                    onClick={() => toggleTrek(trek.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected ? "bg-emerald-50/50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{trek.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {trek.region && <span className="text-xs text-slate-400">{trek.region}</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${difficultyColor[trek.difficulty] || "text-slate-500"}`}>
                          {trek.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-slate-700">{trek.duration} days</p>
                      <p className="text-xs text-slate-400">${trek.price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Notes</h2>
        <textarea
          name="notes"
          defaultValue={traveller?.notes || ""}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          placeholder="Additional notes about this traveller..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/crm/travellers"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700"
        >
          <Save className="h-4 w-4" />
          {traveller ? "Update Traveller" : "Save Traveller"}
        </button>
      </div>
    </form>
  );
}
