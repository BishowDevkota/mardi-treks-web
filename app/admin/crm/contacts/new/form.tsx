"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Search, MapPin, Check, X } from "lucide-react";
import { createContact, updateContact } from "../../actions";

export function CrmContactForm({
  contact,
  users,
  treks,
  prefill,
}: {
  contact: any | null;
  users: { id: string; name: string | null; email: string | null }[];
  treks: { id: string; title: string; slug: string; duration: number; difficulty: string; price: number; region: string | null }[];
  prefill?: { name: string; email: string; userId: string } | null;
}) {
  const router = useRouter();
  const [selectedTrekIds, setSelectedTrekIds] = useState<string[]>(
    contact?.completedTrekIds
      ? (typeof contact.completedTrekIds === "string" ? JSON.parse(contact.completedTrekIds) : contact.completedTrekIds)
      : []
  );
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
        if (contact) {
          await updateContact(contact.id, formData);
        } else {
          await createContact(formData);
        }
        router.refresh();
      }}
      className="space-y-6"
    >
      {/* Basic Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name *</label>
            <input name="name" defaultValue={contact?.name || prefill?.name || ""} required className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
            <input name="email" type="email" defaultValue={contact?.email || prefill?.email || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
            <input name="phone" defaultValue={contact?.phone || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="+977-98..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Company</label>
            <input name="company" defaultValue={contact?.company || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Company name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Position</label>
            <input name="position" defaultValue={contact?.position || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Job title" />
          </div>
        </div>
      </div>

      {/* Type & Source */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Classification</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
            <select name="type" defaultValue={contact?.type || "lead"} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100">
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Source</label>
            <select name="source" defaultValue={contact?.source || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100">
              <option value="">Select source...</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social">Social Media</option>
              <option value="booking">Booking</option>
              <option value="manual">Manual Entry</option>
              <option value="import">Import</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Link to User</label>
            <select name="userId" defaultValue={contact?.userId || prefill?.userId || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100">
              <option value="">Not linked</option>
              {users.map((u) => (<option key={u.id} value={u.id}>{u.name || u.email}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Address</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3"><input name="address" defaultValue={contact?.address || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Street address" /></div>
          <div><input name="city" defaultValue={contact?.city || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="City" /></div>
          <div><input name="country" defaultValue={contact?.country || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Country" /></div>
        </div>
      </div>

      {/* Online */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Online Presence</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><input name="linkedInUrl" defaultValue={contact?.linkedInUrl || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="https://linkedin.com/in/..." /></div>
          <div><input name="website" defaultValue={contact?.website || ""} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="https://..." /></div>
        </div>
      </div>

      {/* Completed Treks Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Completed Treks</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedTrekIds.length} trek{selectedTrekIds.length !== 1 ? "s" : ""} selected
              {contact?.autoTracked && <span className="ml-2 text-emerald-600 font-medium">· Auto-tracked from bookings</span>}
            </p>
          </div>
        </div>
        {selectedTreks.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedTreks.map((trek) => (
              <div key={trek.id} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <MapPin className="h-3 w-3" />{trek.title}
                <button type="button" onClick={() => toggleTrek(trek.id)} className="ml-0.5 hover:text-emerald-900"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={trekSearch} onChange={(e) => setTrekSearch(e.target.value)} placeholder="Search treks to mark as completed..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
          {filteredTreks.length === 0 ? (<div className="px-4 py-8 text-center text-sm text-slate-400">No treks found</div>) : (
            <div className="divide-y divide-slate-100">
              {filteredTreks.map((trek) => {
                const isSelected = selectedTrekIds.includes(trek.id);
                return (
                  <button key={trek.id} type="button" onClick={() => toggleTrek(trek.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? "bg-emerald-50/50" : "hover:bg-slate-50"}`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{trek.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {trek.region && <span className="text-xs text-slate-400">{trek.region}</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${difficultyColor[trek.difficulty] || "text-slate-500"}`}>{trek.difficulty}</span>
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
        <textarea name="notes" defaultValue={contact?.notes || ""} rows={4} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Internal notes about this contact..." />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <Link
          href="/admin/crm/contacts"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700"
        >
          <Save className="h-4 w-4" />
          {contact ? "Update Contact" : "Save Contact"}
        </button>
      </div>
    </form>
  );
}
