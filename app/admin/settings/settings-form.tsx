"use client";

import { useRouter } from "next/navigation";
import { updateSettings } from "./actions";
import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const defaultNavItems = [
  { label: "Treks", href: "/treks" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const defaultSocialLinks = [
  { platform: "facebook", url: "" },
  { platform: "instagram", url: "" },
  { platform: "twitter", url: "" },
  { platform: "youtube", url: "" },
];

export function SettingsForm({ settings }: { settings: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("brand");
  const [socialLinks, setSocialLinks] = useState(() => {
    try { return JSON.parse(settings?.socialLinks || "null") || defaultSocialLinks; }
    catch { return defaultSocialLinks; }
  });
  const [navigation, setNavigation] = useState(() => {
    try { return JSON.parse(settings?.navigation || "null") || defaultNavItems; }
    catch { return defaultNavItems; }
  });

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("socialLinks", JSON.stringify(socialLinks));
    fd.set("navigation", JSON.stringify(navigation));
    await updateSettings(fd);
    setSaving(false);
    setSuccess(true);
    router.refresh();
  }

  function addNavItem() {
    setNavigation([...navigation, { label: "", href: "" }]);
  }

  function removeNavItem(index: number) {
    setNavigation(navigation.filter((_: any, i: number) => i !== index));
  }

  function updateNavItem(index: number, field: string, value: string) {
    const updated = [...navigation];
    updated[index] = { ...updated[index], [field]: value };
    setNavigation(updated);
  }

  function addSocialLink() {
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  }

  function removeSocialLink(index: number) {
    setSocialLinks(socialLinks.filter((_: any, i: number) => i !== index));
  }

  function updateSocialLink(index: number, field: string, value: string) {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  }

  const tabs = [
    { id: "brand", label: "Brand" },
    { id: "contact", label: "Contact" },
    { id: "navigation", label: "Navigation" },
    { id: "social", label: "Social Links" },
    { id: "seo", label: "SEO" },
  ];

  const platformIcons: Record<string, string> = {
    facebook: "📘",
    instagram: "📷",
    twitter: "🐦",
    youtube: "▶️",
    tiktok: "🎵",
    linkedin: "💼",
    whatsapp: "💬",
    telegram: "✈️",
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-teal-50 text-teal-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Brand Tab */}
        {activeTab === "brand" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg">🏷️</div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Brand Settings</h2>
                <p className="text-xs text-slate-500">Manage your site identity</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Site Name *</label>
                <input
                  name="siteName"
                  defaultValue={settings?.siteName || "Mardi Treks"}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Tagline</label>
                <input
                  name="tagline"
                  defaultValue={settings?.tagline || ""}
                  placeholder="e.g. Explore the Himalayas with Expert Guides"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={settings?.description || ""}
                  placeholder="Brief description of your trekking business"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Logo Cloudinary Public ID</label>
                <input
                  name="logo"
                  defaultValue={settings?.logo || ""}
                  placeholder="e.g. mardi-treks/logo"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <p className="mt-1 text-xs text-slate-400">Your logo Cloudinary public ID. Leave empty to use the default Mountain icon.</p>
              </div>
            </div>
          </section>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-lg">📞</div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Contact Information</h2>
                <p className="text-xs text-slate-500">How customers can reach you</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={settings?.email || ""}
                    placeholder="info@marditreks.com"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-4 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
                <input
                  name="phone"
                  defaultValue={settings?.phone || ""}
                  placeholder="+977 1-2345678"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                <input
                  name="address"
                  defaultValue={settings?.address || ""}
                  placeholder="Kathmandu, Nepal"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          </section>
        )}

        {/* Navigation Tab */}
        {activeTab === "navigation" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-lg">🧭</div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Navigation</h2>
                  <p className="text-xs text-slate-500">Manage your site navigation menu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addNavItem}
                className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {navigation.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateNavItem(i, "label", e.target.value)}
                    placeholder="Label"
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
            {navigation.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No navigation items. Click &quot;Add Item&quot; to create one.</p>
            )}
            <input type="hidden" name="navigation" value={JSON.stringify(navigation)} />
          </section>
        )}

        {/* Social Links Tab */}
        {activeTab === "social" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 text-lg">🔗</div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Social Links</h2>
                  <p className="text-xs text-slate-500">Connect your social media profiles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addSocialLink}
                className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
              >
                <Plus className="h-3.5 w-3.5" /> Add Link
              </button>
            </div>
            <div className="space-y-2">
              {socialLinks.map((link: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <span className="text-lg shrink-0">{platformIcons[link.platform] || "🔗"}</span>
                  <input
                    type="text"
                    value={link.platform}
                    onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                    placeholder="Platform (facebook, instagram...)"
                    className="w-36 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialLink(i)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {socialLinks.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No social links. Click &quot;Add Link&quot; to create one.</p>
            )}
            <input type="hidden" name="socialLinks" value={JSON.stringify(socialLinks)} />
          </section>
        )}

        {/* SEO Tab */}
        {activeTab === "seo" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 text-lg">🔍</div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Default SEO</h2>
                <p className="text-xs text-slate-500">Global SEO settings for your site</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Default Meta Title</label>
                <input
                  name="defaultMetaTitle"
                  defaultValue={settings?.defaultMetaTitle || ""}
                  placeholder="Mardi Treks | Premier Trekking & Tour Agency in Nepal"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Default Meta Description</label>
                <textarea
                  name="defaultMetaDescription"
                  rows={3}
                  defaultValue={settings?.defaultMetaDescription || ""}
                  placeholder="Experience the Himalayas with Mardi Treks..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Default OG Image (Cloudinary Public ID)</label>
                <input
                  name="defaultOgImage"
                  defaultValue={settings?.defaultOgImage || ""}
                  placeholder="e.g. mardi-treks/og-default"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <p className="mt-1 text-xs text-slate-400">Default image used for social sharing.</p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">Save Changes</p>
          <p className="text-xs text-slate-400">Your settings are saved immediately site-wide</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-md disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {success && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved!
          </span>
        )}
      </div>
    </form>
  );
}
