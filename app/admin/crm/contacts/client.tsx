"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Mail, Phone, Building2, MapPin,
  MoreHorizontal, Pencil, Trash2, Tags, UserPlus,
  Link2, Users, Filter, X, CheckCircle, Globe
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteContact, removeTagFromContact, addTagToContact, mergeContacts } from "../actions";

export function CrmContactsClient({
  contacts,
  tags,
  treks,
  currentType,
  currentTag,
  searchQuery,
  registeredUserCount,
}: {
  contacts: any[];
  tags: any[];
  treks?: any[];
  currentType: string;
  currentTag: string;
  searchQuery: string;
  registeredUserCount?: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showMerge, setShowMerge] = useState(false);
  const [primaryId, setPrimaryId] = useState("");
  const [secondaryId, setSecondaryId] = useState("");
  const [showTagModal, setShowTagModal] = useState<string | null>(null);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");

  const filtered = contacts.filter((c) => {
    if (currentType !== "all" && c.type !== currentType) return false;
    if (currentTag && !c.tags.some((t: any) => t.tag.name === currentTag)) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !(c.email || "").toLowerCase().includes(search.toLowerCase()) &&
        !(c.company || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeStyles: Record<string, string> = {
    lead: "bg-blue-50 text-blue-700 border-blue-200",
    customer: "bg-emerald-50 text-emerald-700 border-emerald-200",
    partner: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600",
    inactive: "bg-slate-50 text-slate-500",
    blocked: "bg-red-50 text-red-600",
  };

  async function handleDelete(id: string) {
    await deleteContact(id);
    setShowDeleteConfirm(null);
    router.refresh();
  }

  async function handleRemoveTag(contactId: string, tagId: string) {
    await removeTagFromContact(contactId, tagId);
    router.refresh();
  }

  async function handleAddTag(contactId: string, tagId: string) {
    await addTagToContact(contactId, tagId);
    router.refresh();
  }

  async function handleMerge() {
    if (!primaryId || !secondaryId || primaryId === secondaryId) return;
    await mergeContacts(primaryId, secondaryId);
    setShowMerge(false);
    router.refresh();
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", newTagName);
    fd.set("color", newTagColor);
    const { createTag } = await import("../actions");
    await createTag(fd);
    setNewTagName("");
    setNewTagColor("#6366f1");
    setShowNewTag(false);
    router.refresh();
  }

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
            placeholder="Search contacts..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {["all", "lead", "customer", "partner"].map((t) => (
            <Link
              key={t}
              href={`/admin/crm/contacts?type=${t}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                currentType === t
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setShowMerge(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Link2 className="h-3.5 w-3.5" />
          Merge
        </button>
      </div>

      {/* Contacts Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white py-16">
          <Users className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">No contacts found</p>
          <p className="mt-1 text-xs text-slate-400">Add your first contact to get started.</p>
          <Link
            href="/admin/crm/contacts/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Actions */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {contact._isVirtual ? (
                  <Link
                    href={`/admin/crm/contacts/new?userId=${contact.userId}&name=${encodeURIComponent(contact.name)}&email=${encodeURIComponent(contact.email || "")}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-[10px] font-medium text-blue-600 hover:bg-blue-100"
                  >
                    <UserPlus className="h-3 w-3" />
                    Link to CRM
                  </Link>
                ) : (
                  <>
                    <Link href={`/admin/crm/contacts/new?id=${contact.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button onClick={() => setShowTagModal(contact.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <Tags className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(contact.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                  contact._isVirtual ? "bg-gradient-to-br from-blue-400 to-blue-600" : "bg-gradient-to-br from-teal-400 to-teal-600"
                }`}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">{contact.name}</p>
                    {contact._isVirtual && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
                        <Users className="h-2.5 w-2.5" />
                        User
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                      typeStyles[contact.type] || "bg-slate-50 text-slate-600"
                    }`}>
                      {contact.type}
                    </span>
                    <span className={`text-[10px] font-medium ${statusStyles[contact.status] || "text-slate-400"}`}>
                      {contact.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-3 space-y-1.5">
                {contact.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{contact.company}</span>
                  </div>
                )}
                {(contact.city || contact.country) && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{[contact.city, contact.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {contact.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {contact.tags.map((t: any) => (
                    <span
                      key={t.tag.id}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: t.tag.color + "20", color: t.tag.color }}
                    >
                      {t.tag.name}
                      <button
                        onClick={() => handleRemoveTag(contact.id, t.tag.id)}
                        className="hover:opacity-70"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Completed Treks */}
              {contact.completedTreks && contact.completedTreks.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Completed Treks ({contact.completedTreks.length})
                    {contact.autoTracked && <span className="ml-1.5 text-emerald-600 normal-case font-medium">· Auto</span>}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.completedTreks.slice(0, 3).map((trek: any) => (
                      <span key={trek.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <CheckCircle className="h-2.5 w-2.5" />
                        {trek.title}
                      </span>
                    ))}
                    {contact.completedTreks.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{contact.completedTreks.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                {contact.user && <span className="text-teal-600">Registered user</span>}
                <span className="ml-auto">{formatDate(contact.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Contact?</h3>
            <p className="mt-2 text-sm text-slate-500">
              This will permanently remove this contact and all associated deals, activities, and logs.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Management Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Manage Tags</h3>
              <button onClick={() => setShowTagModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => {
                const isAttached = contacts.find((c) => c.id === showTagModal)?.tags?.some((t: any) => t.tag.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => isAttached ? handleRemoveTag(showTagModal, tag.id) : handleAddTag(showTagModal, tag.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      isAttached ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {tag.name}
                    {isAttached ? " ✓" : " +"}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowNewTag(!showNewTag)}
              className="text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              + Create New Tag
            </button>
            {showNewTag && (
              <form onSubmit={handleCreateTag} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  required
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-8 w-8 rounded-lg border border-slate-200 cursor-pointer"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                >
                  Add
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Merge Contacts</h3>
            <p className="mt-2 text-sm text-slate-500">Merge two contacts. The secondary contact will be merged into the primary and then deleted.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Primary Contact (keep)</label>
                <select
                  value={primaryId}
                  onChange={(e) => setPrimaryId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Select contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Secondary Contact (merge into primary)</label>
                <select
                  value={secondaryId}
                  onChange={(e) => setSecondaryId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Select contact...</option>
                  {contacts.filter((c) => c.id !== primaryId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowMerge(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleMerge}
                disabled={!primaryId || !secondaryId || primaryId === secondaryId}
                className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
