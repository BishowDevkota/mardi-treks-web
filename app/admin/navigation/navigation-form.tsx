"use client";

import { useState, useRef, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Loader2, Plus, Trash2, GripVertical, ImageIcon, X, Upload, ChevronDown, ChevronRight, Search, Menu,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { ImageUpload, type ImageUploadHandle } from "@/components/admin/trek-sections/ImageUpload";
import { updateNavigationSettings } from "./actions";

interface NavItem {
  label: string;
  href: string;
}

interface TrekItem {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  status: string;
  duration: number;
  price: number;
}

interface CategoryRegion {
  id: string;
  name: string;
  slug: string;
}

interface CategoryWithTreks {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  treks: TrekItem[];
  regions: CategoryRegion[];
}

const defaultNavItems = [
  { label: "Treks", href: "/treks" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function NavigationForm({
  logo,
  navigation,
  categoryDropdownTreks,
  treksByCategory,
  topBarContent: initialTopBarContent,
}: {
  logo: string;
  navigation: NavItem[];
  categoryDropdownTreks: Record<string, string[]>;
  treksByCategory: CategoryWithTreks[];
  topBarContent?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [logoPublicId, setLogoPublicId] = useState(logo);
  const logoUploadRef = useRef<ImageUploadHandle>(null);
  const [navItems, setNavItems] = useState<NavItem[]>(
    navigation.length > 0 ? navigation : defaultNavItems
  );
  const [categorySearch, setCategorySearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [savingRegions, setSavingRegions] = useState(false);

  // Initialize editable regions per category
  const [editableRegions, setEditableRegions] = useState<Record<string, CategoryRegion[]>>(() => {
    const initial: Record<string, CategoryRegion[]> = {};
    for (const cat of treksByCategory) {
      initial[cat.slug] = cat.regions || [];
    }
    return initial;
  });

  // Initialize selected treks per category
  const [selectedTreks, setSelectedTreks] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const cat of treksByCategory) {
      initial[cat.slug] = categoryDropdownTreks[cat.slug] || [];
    }
    return initial;
  });

  function addNavItem() {
    setNavItems([...navItems, { label: "", href: "" }]);
  }

  function removeNavItem(index: number) {
    setNavItems(navItems.filter((_, i) => i !== index));
  }

  function updateNavItem(index: number, field: "label" | "href", value: string) {
    const updated = [...navItems];
    updated[index] = { ...updated[index], [field]: value };
    setNavItems(updated);
  }

  function toggleTrekSelection(categorySlug: string, trekId: string) {
    setSelectedTreks((prev) => {
      const current = prev[categorySlug] || [];
      const isSelected = current.includes(trekId);
      return {
        ...prev,
        [categorySlug]: isSelected
          ? current.filter((id) => id !== trekId)
          : [...current, trekId],
      };
    });
  }

  function toggleCategory(categorySlug: string) {
    setExpandedCategories((prev) => ({
      ...prev,
      [categorySlug]: !prev[categorySlug],
    }));
  }

  function toggleAllTreks(categorySlug: string) {
    const cat = treksByCategory.find((c) => c.slug === categorySlug);
    if (!cat) return;
    const currentSelected = selectedTreks[categorySlug] || [];
    if (currentSelected.length === cat.treks.length) {
      setSelectedTreks((prev) => ({ ...prev, [categorySlug]: [] }));
    } else {
      setSelectedTreks((prev) => ({
        ...prev,
        [categorySlug]: cat.treks.map((t) => t.id),
      }));
    }
  }

  // ── Region management ────────────────────────────────────────────
  function addRegion(categorySlug: string) {
    const cat = treksByCategory.find((c) => c.slug === categorySlug);
    if (!cat) return;
    setEditableRegions((prev) => ({
      ...prev,
      [categorySlug]: [...(prev[categorySlug] || []), { id: "", name: "", slug: "" }],
    }));
  }

  function updateRegion(categorySlug: string, index: number, name: string) {
    setEditableRegions((prev) => {
      const regions = [...(prev[categorySlug] || [])];
      regions[index] = { ...regions[index], name, slug: name.toLowerCase().replace(/\s+/g, "-") };
      return { ...prev, [categorySlug]: regions };
    });
  }

  function removeRegion(categorySlug: string, index: number) {
    setEditableRegions((prev) => {
      const regions = (prev[categorySlug] || []).filter((_, i) => i !== index);
      return { ...prev, [categorySlug]: regions };
    });
  }

  async function handleSaveRegions() {
    setSavingRegions(true);
    // Flatten all regions with categoryId
    const allRegions: { id?: string; name: string; categoryId: string }[] = [];
    for (const cat of treksByCategory) {
      const regions = editableRegions[cat.slug] || [];
      for (const r of regions) {
        if (r.name.trim()) {
          allRegions.push({ id: r.id || undefined, name: r.name.trim(), categoryId: cat.id });
        }
      }
    }
    try {
      // Dynamic import to avoid circular issues
      const { saveCategoryRegions } = await import("./actions");
      await saveCategoryRegions(allRegions);
      router.refresh();
    } catch (err) {
      console.error("Failed to save regions", err);
    }
    setSavingRegions(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);

    // Upload pending logo to Cloudinary first
    const uploadedId = await logoUploadRef.current?.save() ?? null;

    const fd = new FormData(form);
    fd.set("navigation", JSON.stringify(navItems));
    fd.set("categoryDropdownTreks", JSON.stringify(selectedTreks));
    fd.set("logo", uploadedId || logoPublicId);
    fd.set("previousLogo", logo); // pass the original logo for Cloudinary cleanup
    try {
      await updateNavigationSettings(fd);
      setSaving(false);
      router.refresh();
    } catch {
      setSaving(false);
    }
  }

  const filteredCategories = categorySearch
    ? treksByCategory.filter(
        (cat) =>
          cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
          cat.treks.some((t) => t.title.toLowerCase().includes(categorySearch.toLowerCase()))
      )
    : treksByCategory;

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-8">
      {/* Logo Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-lg">🖼️</div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Site Logo</h2>
            <p className="text-xs text-slate-400">Upload or set the logo displayed in the navigation bar.</p>
          </div>
        </div>
        <div className="flex items-start gap-6">
          <div className="w-48 shrink-0">
            <ImageUpload ref={logoUploadRef} value={logoPublicId} onChange={setLogoPublicId} label="" folder="mardi-treks" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Or enter Cloudinary Public ID
            </label>
            <input
              name="logo"
              value={logoPublicId}
              onChange={(e) => {
                setLogoPublicId(e.target.value);
              }}
              placeholder="e.g. mardi-treks/logo"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Leave empty to use the default Mountain icon.
            </p>
          </div>
        </div>
      </section>

      {/* Top Bar Content */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 text-lg">📋</div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Header Top Bar</h2>
            <p className="text-xs text-slate-400">
              Content shown above the main navigation bar (license numbers, links, etc.). Use the rich text editor below.
            </p>
          </div>
        </div>
        <div>
          <TopBarEditor initialContent={initialTopBarContent || ""} />
          <input id="topBarContentInput" type="hidden" name="topBarContent" defaultValue={initialTopBarContent || ""} />
        </div>
      </section>

      {/* Navigation Items */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-lg">🧭</div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Navigation Links</h2>
              <p className="text-xs text-slate-400">
                Manage the top-level links in the navigation bar. Category dropdown treks are configured below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addNavItem}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <Plus className="h-3 w-3" /> Add Link
          </button>
        </div>

        {navItems.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-8">
            <Menu className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">No navigation links</p>
            <p className="text-xs text-slate-400">Click &quot;Add Link&quot; to create one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {navItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
              >
                <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateNavItem(i, "label", e.target.value)}
                  placeholder="Label (e.g. Treks)"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <input
                  type="text"
                  value={item.href}
                  onChange={(e) => updateNavItem(i, "href", e.target.value)}
                  placeholder="/path"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <button
                  type="button"
                  onClick={() => removeNavItem(i)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input type="hidden" name="navigation" value={JSON.stringify(navItems)} />
      </section>

      {/* Category Dropdown Treks */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-lg">📂</div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Category Dropdown Treks</h2>
            <p className="text-xs text-slate-400">
              For each category, select which treks appear in the dropdown menu. Unchecked treks are hidden from the dropdown.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search categories or treks..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-10">
            <p className="text-sm font-medium text-slate-500">No categories found</p>
            <p className="text-xs text-slate-400">Create categories with published treks first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCategories.map((cat) => {
              const isExpanded = expandedCategories[cat.slug] ?? true;
              const selected = selectedTreks[cat.slug] || [];
              const allSelected = cat.treks.length > 0 && selected.length === cat.treks.length;
              const someSelected = selected.length > 0 && !allSelected;

              return (
                <div
                  key={cat.slug}
                  className="rounded-xl border border-slate-200 overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    className="flex w-full items-center gap-3 bg-slate-50/80 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-lg">{cat.icon || "📁"}</span>
                    <span className="flex-1 text-sm font-semibold text-slate-900">{cat.name}</span>
                    <span className="text-xs text-slate-400">({cat.treks.length} treks)</span>

                    {/* Select all toggle */}
                    {cat.treks.length > 0 && (
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={() => toggleAllTreks(cat.slug)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        {allSelected ? "All selected" : someSelected ? `${selected.length} selected` : "Select all"}
                      </label>
                    )}
                  </button>

                  {/* Trek List */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100 border-t border-slate-200">
                      {cat.treks.length === 0 ? (
                        <p className="px-4 py-4 text-xs text-slate-400">
                          No published treks in this category.
                        </p>
                      ) : (
                        cat.treks.map((trek) => {
                          const isSelected = selected.includes(trek.id);
                          return (
                            <label
                              key={trek.id}
                              className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                                isSelected ? "bg-teal-50/50" : "hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTrekSelection(cat.slug, trek.id)}
                                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {trek.title}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {trek.duration} days · ${trek.price}
                                </p>
                              </div>
                              {isSelected && (
                                <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                                  In dropdown
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <input type="hidden" name="categoryDropdownTreks" value={JSON.stringify(selectedTreks)} />
      </section>

      {/* ====================== REGIONS ====================== */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-lg">🌍</div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Category Regions</h2>
            <p className="text-xs text-slate-400">
              Define regions for each category. Treks are grouped by region in the navigation dropdown.
            </p>
          </div>
        </div>

        {treksByCategory.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-10">
            <p className="text-sm font-medium text-slate-500">No categories</p>
            <p className="text-xs text-slate-400">Create categories first to add regions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {treksByCategory.map((cat) => {
              const isExpanded = expandedRegions[cat.slug] ?? false;
              const regions = editableRegions[cat.slug] || [];

              return (
                <div key={cat.slug} className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRegions((prev) => ({ ...prev, [cat.slug]: !isExpanded }))
                    }
                    className="flex w-full items-center gap-3 bg-slate-50/80 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-lg">{cat.icon || "📁"}</span>
                    <span className="flex-1 text-sm font-semibold text-slate-900">{cat.name}</span>
                    <span className="text-xs text-slate-400">({regions.length} regions)</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 space-y-3">
                      {regions.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2">
                          No regions defined yet. Add one below.
                        </p>
                      )}
                      {regions.map((region, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                          <input
                            type="text"
                            value={region.name}
                            onChange={(e) => updateRegion(cat.slug, idx, e.target.value)}
                            placeholder="Region name (e.g. Everest Region)"
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                          />
                          {region.slug && (
                            <span className="text-[10px] font-mono text-slate-400 hidden sm:block">
                              /{region.slug}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeRegion(cat.slug, idx)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addRegion(cat.slug)}
                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Add Region
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveRegions}
            disabled={savingRegions}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {savingRegions ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {savingRegions ? "Saving..." : "Save Regions"}
          </button>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Navigation Settings"}
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

// ── Top Bar Rich Text Editor ────────────────────────────────────────
function TopBarEditor({ initialContent }: { initialContent: string }) {
  const [mounted, setMounted] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: initialContent,
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3" },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const input = document.getElementById("topBarContentInput") as HTMLInputElement;
      if (input) input.value = html;
    },
  });

  useEffect(() => { startTransition(() => setMounted(true)); }, []);

  if (!mounted || !editor) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center min-h-[160px]">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${editor.isActive("bold") ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${editor.isActive("italic") ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${editor.isActive("bulletList") ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${editor.isActive("orderedList") ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}>1. List</button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <button type="button" onClick={() => {
          const url = window.prompt("Enter URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${editor.isActive("link") ? "bg-sky-100 text-sky-700" : "text-slate-500 hover:bg-slate-100"}`}>🔗 Link</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
