"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Mail, Phone, MapPin, Trash2, Pencil,
  UserPlus, CheckCircle, Clock, Users, Globe
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteTraveller } from "../actions";

export function CrmTravellersClient({
  travellers,
  treks,
  searchQuery,
}: {
  travellers: any[];
  treks: { id: string; title: string; slug: string; duration: number; difficulty: string }[];
  searchQuery: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterTracked, setFilterTracked] = useState<string>("all");

  const filtered = travellers.filter((t) => {
    if (filterTracked === "auto" && !t.autoTracked) return false;
    if (filterTracked === "manual" && t.autoTracked) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !(t.email || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleDelete(id: string) {
    await deleteTraveller(id);
    setShowDeleteConfirm(null);
    router.refresh();
  }

  const difficultyColor: Record<string, string> = {
    easy: "bg-emerald-50 text-emerald-600",
    moderate: "bg-amber-50 text-amber-600",
    challenging: "bg-orange-50 text-orange-600",
    difficult: "bg-red-50 text-red-600",
    extreme: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search travellers..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {[
            { label: "All", value: "all" },
            { label: "Auto-tracked", value: "auto" },
            { label: "Manual", value: "manual" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterTracked(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterTracked === f.value
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Travellers List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white py-16">
          <Users className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">No travellers found</p>
          <p className="mt-1 text-xs text-slate-400">
            {filterTracked === "auto" ? "No auto-tracked travellers yet. Complete bookings will create them." : "Add your first traveller to get started."}
          </p>
          <Link
            href="/admin/crm/travellers/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
          >
            <UserPlus className="h-4 w-4" />
            Add Traveller
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((traveller) => (
            <div
              key={traveller.id}
              className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Actions */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Link
                  href={`/admin/crm/travellers/new?id=${traveller.id}`}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(traveller.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-sm font-bold text-white">
                  {traveller.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{traveller.name}</p>
                    {traveller.autoTracked && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="h-2.5 w-2.5" />
                        Auto
                      </span>
                    )}
                  </div>
                  {traveller.contact && (
                    <p className="text-xs text-slate-400">CRM: {traveller.contact.name}</p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-3 space-y-1.5">
                {traveller.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{traveller.email}</span>
                  </div>
                )}
                {traveller.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{traveller.phone}</span>
                  </div>
                )}
                {traveller.nationality && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span>{traveller.nationality}</span>
                  </div>
                )}
              </div>

              {/* Completed Treks */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Completed Treks ({traveller.completedTreks.length})
                </p>
                {traveller.completedTreks.length > 0 ? (
                  <div className="space-y-1.5">
                    {traveller.completedTreks.slice(0, 3).map((trek: any) => (
                      <div key={trek.id} className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 shrink-0 text-emerald-500" />
                        <span className="text-xs text-slate-600 truncate">{trek.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${difficultyColor[trek.difficulty] || "bg-slate-50 text-slate-500"}`}>
                          {trek.difficulty}
                        </span>
                      </div>
                    ))}
                    {traveller.completedTreks.length > 3 && (
                      <p className="text-[10px] text-slate-400 pl-5">
                        +{traveller.completedTreks.length - 3} more treks
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No completed treks recorded</p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span>Created {formatDate(traveller.createdAt)}</span>
                {traveller.user && (
                  <span className="text-teal-600">Linked to user</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Traveller?</h3>
            <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
