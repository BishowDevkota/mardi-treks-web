"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { savePageContent } from "./actions";
import { Plus, Trash2, Save, Loader2, GripVertical } from "lucide-react";
import { ImageUpload } from "@/components/admin/trek-sections/ImageUpload";
import { FeaturedTrekSelector } from "@/components/admin/FeaturedTrekSelector";

const defaultWhyChooseUsItems = [
  { icon: "Shield", title: "Safety First", description: "Every guide is wilderness first-aid certified with years of high-altitude experience." },
  { icon: "Heart", title: "Community Impact", description: "We invest in local communities — fair wages, school support, and sustainable practices." },
  { icon: "Award", title: "Expert Knowledge", description: "Our team has decades of combined experience across Nepal's trekking regions." },
  { icon: "Globe", title: "Sustainable Travel", description: "Leave No Trace principles, eco-friendly lodges, and carbon offset programs." },
];

const defaultTeam = [
  { name: "Rajesh Gurung", role: "Founder & Lead Guide", image: "" },
  { name: "Maya Sherpa", role: "Operations Manager", image: "" },
  { name: "David Thapa", role: "Senior Trek Guide", image: "" },
  { name: "Anita Rai", role: "Customer Relations", image: "" },
];

const defaultInfoCards = [
  { icon: "Mail", title: "Email Us", description: "info@marditreks.com" },
  { icon: "Phone", title: "Call Us", description: "+977-1-2345678" },
  { icon: "MapPin", title: "Office", description: "Thamel, Kathmandu, Nepal" },
  { icon: "Clock", title: "Office Hours", description: "Sun-Fri: 9AM-6PM" },
];

const defaultSocialLinks = [
  { platform: "facebook", url: "" },
  { platform: "instagram", url: "" },
  { platform: "twitter", url: "" },
  { platform: "youtube", url: "" },
];

type SectionBlock = { id: string; type: string; heading: string; description: string; content?: string };

interface Trek {
  id: string;
  title: string;
  slug: string;
  region: string;
  difficulty: string;
  duration: number;
  price: number;
  heroImage?: string | null;
  _count?: { reviews: number };
}

export function PageManagerForm({
  pageContent: saved,
  treks = [],
  initialFeaturedIds = [],
  initialFeaturedSectionIds = [],
}: {
  pageContent: any;
  treks?: Trek[];
  initialFeaturedIds?: string[];
  initialFeaturedSectionIds?: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [success, setSuccess] = useState(false);

  const pc = saved || {};

  // ── About state ──
  const [aboutHero, setAboutHero] = useState(pc.about?.hero || { heading: "About Mardi Treks", description: "", backgroundImage: "" });
  const [aboutSeo, setAboutSeo] = useState(pc.about?.seo || { title: "", description: "", keywords: "" });
  const [aboutWhy, setAboutWhy] = useState(pc.about?.whyChooseUs || { heading: "Why Trek With Us?", subtitle: "Discover the Difference", items: defaultWhyChooseUsItems, bgImage: "" });
  const [aboutTeam, setAboutTeam] = useState(pc.about?.team || defaultTeam);
  const [aboutGallery, setAboutGallery] = useState(pc.about?.gallery || []);
  const [aboutSections, setAboutSections] = useState<SectionBlock[]>(pc.about?.sections || []);

  // ── Contact state ──
  const [contactHero, setContactHero] = useState(pc.contact?.hero || { heading: "Contact Us", description: "", backgroundImage: "" });
  const [contactSeo, setContactSeo] = useState(pc.contact?.seo || { title: "", description: "", keywords: "" });
  const [contactMapIframe, setContactMapIframe] = useState(pc.contact?.mapIframe || "");
  const [contactInfoCards, setContactInfoCards] = useState(pc.contact?.infoCards || defaultInfoCards);

  // ── Home state ──
  const [homeHero, setHomeHero] = useState(pc.home?.hero || { badge: "", title: "", titleHighlight: "", subtitle: "", description: "", backgroundImage: "" });
  const [homeSections, setHomeSections] = useState(pc.home?.sections || { featuredTreksHeading: "", featuredTreksDescription: "", bestSellingTreksHeading: "", bestSellingTreksDescription: "", topRatedTreksHeading: "", topRatedTreksDescription: "", reviewsHeading: "", reviewsDescription: "", blogHeading: "", blogDescription: "" });
  const [homeWhy, setHomeWhy] = useState(pc.home?.whyChooseUs || { heading: "Why Trek With Us?", subtitle: "Discover the Difference", bgImage: "", items: defaultWhyChooseUsItems });
  const [homeContact, setHomeContact] = useState(pc.home?.contact || { heading: "Get in Touch", description: "", infoCards: defaultInfoCards });
  function setHomeHeroField(field: string, val: any) { setHomeHero((prev: any) => ({ ...prev, [field]: val })); }
  function setHomeSectionField(field: string, val: any) { setHomeSections((prev: any) => ({ ...prev, [field]: val })); }
  function addHomeWhyItem() { setHomeWhy((prev: any) => ({ ...prev, items: [...prev.items, { icon: "Shield", title: "", description: "" }] })); }
  function updateHomeWhyItem(i: number, field: string, val: any) { setHomeWhy((prev: any) => { const items = [...prev.items]; items[i] = { ...items[i], [field]: val }; return { ...prev, items }; }); }
  function removeHomeWhyItem(i: number) { setHomeWhy((prev: any) => ({ ...prev, items: prev.items.filter((_: any, idx: number) => idx !== i) })); }
  function addHomeInfoCard() { setHomeContact((prev: any) => ({ ...prev, infoCards: [...prev.infoCards, { title: "", description: "" }] })); }
  function updateHomeInfoCard(i: number, field: string, val: any) { setHomeContact((prev: any) => { const cards = [...prev.infoCards]; cards[i] = { ...cards[i], [field]: val }; return { ...prev, infoCards: cards }; }); }
  function removeHomeInfoCard(i: number) { setHomeContact((prev: any) => ({ ...prev, infoCards: prev.infoCards.filter((_: any, idx: number) => idx !== i) })); }

  // ── Home SEO ──
  const [homeSeo, setHomeSeo] = useState(pc.home?.seo || { title: "", description: "", keywords: "" });

  // ── Blog state ──
  const [blogHero, setBlogHero] = useState(pc.blog?.hero || { heading: "Our Blog", description: "", backgroundImage: "" });
  const [blogSeo, setBlogSeo] = useState(pc.blog?.seo || { title: "", description: "", keywords: "" });

  // ── Footer state ──
  const [footer, setFooter] = useState(pc.footer || {
    brandDescription: "Experience the Himalayas with Mardi Treks. Expert-guided trekking and tour packages in Nepal.",
    email: "info@marditreks.com",
    phone: "+977-1-2345678",
    address: "Thamel, Kathmandu, Nepal",
    socialLinks: defaultSocialLinks,
    copyright: `© ${new Date().getFullYear()} Mardi Treks. All rights reserved.`,
  });

  function setFooterField(field: string, val: any) {
    setFooter((prev: any) => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    // Use the form's own FormData so hidden inputs from FeaturedTrekSelector are included
    const fd = new FormData(e.currentTarget);

    // Home (override with state-managed values)
    fd.set("home_hero_title", homeHero.title);
    fd.set("home_hero_title_highlight", homeHero.titleHighlight);
    fd.set("home_hero_description", homeHero.description);
    fd.set("home_hero_background", homeHero.backgroundImage);
    fd.set("home_sections", JSON.stringify(homeSections));
    fd.set("home_why_heading", homeWhy.heading);
    fd.set("home_why_subtitle", homeWhy.subtitle);
    fd.set("home_why_bg", homeWhy.bgImage);
    fd.set("home_why_items", JSON.stringify(homeWhy.items));
    fd.set("home_contact_heading", homeContact.heading);
    fd.set("home_contact_description", homeContact.description);
    fd.set("home_contact_info_cards", JSON.stringify(homeContact.infoCards));
    fd.set("home_seo_title", homeSeo.title || "");
    fd.set("home_seo_description", homeSeo.description || "");
    fd.set("home_seo_keywords", homeSeo.keywords || "");

    // About
    fd.set("about_hero_heading", aboutHero.heading);
    fd.set("about_hero_description", aboutHero.description);
    fd.set("about_hero_background", aboutHero.backgroundImage);
    fd.set("about_seo_title", aboutSeo.title);
    fd.set("about_seo_description", aboutSeo.description);
    fd.set("about_seo_keywords", aboutSeo.keywords || "");
    fd.set("about_sections", JSON.stringify(aboutSections));
    fd.set("about_why_heading", aboutWhy.heading);
    fd.set("about_why_subtitle", aboutWhy.subtitle);
    fd.set("about_why_items", JSON.stringify(aboutWhy.items));
    fd.set("about_why_bg", aboutWhy.bgImage);
    fd.set("about_team", JSON.stringify(aboutTeam));
    fd.set("about_gallery", JSON.stringify(aboutGallery));

    // Contact
    fd.set("contact_hero_heading", contactHero.heading);
    fd.set("contact_hero_description", contactHero.description);
    fd.set("contact_hero_background", contactHero.backgroundImage);
    fd.set("contact_seo_title", contactSeo.title);
    fd.set("contact_seo_description", contactSeo.description);
    fd.set("contact_seo_keywords", contactSeo.keywords || "");
    fd.set("contact_map_iframe", contactMapIframe);
    fd.set("contact_info_cards", JSON.stringify(contactInfoCards));

    // Blog
    fd.set("blog_hero_heading", blogHero.heading);
    fd.set("blog_hero_description", blogHero.description);
    fd.set("blog_hero_background", blogHero.backgroundImage);
    fd.set("blog_seo_title", blogSeo.title);
    fd.set("blog_seo_description", blogSeo.description);
    fd.set("blog_seo_keywords", blogSeo.keywords || "");

    // Footer
    fd.set("footer_brand_description", footer.brandDescription);
    fd.set("footer_email", footer.email);
    fd.set("footer_phone", footer.phone);
    fd.set("footer_address", footer.address);
    fd.set("footer_social_links", JSON.stringify(footer.socialLinks));
    fd.set("footer_copyright", footer.copyright);

    try {
      await savePageContent(fd);
    } catch {
      // redirect() throws NEXT_REDIRECT — that's expected
    }
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  const tabs = [
    { id: "home", label: "Home" },
    { id: "about", label: "About Us" },
    { id: "contact", label: "Contact" },
    { id: "blog", label: "Blog" },
    { id: "footer", label: "Footer" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">✅ Page content saved successfully!</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ───────────── HOME TAB ───────────── */}
      {activeTab === "home" && (
        <div className="space-y-8">
          {/* SEO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">SEO / Meta</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meta Title</label>
                <input value={homeSeo.title} onChange={(e) => setHomeSeo({ ...homeSeo, title: e.target.value })} placeholder="Mardi Treks | Premier Trekking & Tour Agency" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meta Description</label>
                <textarea rows={2} value={homeSeo.description} onChange={(e) => setHomeSeo({ ...homeSeo, description: e.target.value })} placeholder="Experience the Himalayas with Mardi Treks..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Keywords</label>
                <input value={homeSeo.keywords} onChange={(e) => setHomeSeo({ ...homeSeo, keywords: e.target.value })} placeholder="trekking nepal, everest base camp, annapurna" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Hero Section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hero Section</h3>
                <p className="text-xs text-slate-400">The company slide in the hero carousel</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  name="heroEnabled"
                  defaultChecked={homeHero.heroEnabled !== false}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Show company slide
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input value={homeHero.title} onChange={(e) => setHomeHeroField("title", e.target.value)} placeholder="e.g. Discover the Himalayas" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title Highlight</label>
                <input value={homeHero.titleHighlight} onChange={(e) => setHomeHeroField("titleHighlight", e.target.value)} placeholder="Highlighted word in title" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea rows={2} value={homeHero.description} onChange={(e) => setHomeHeroField("description", e.target.value)} placeholder="Hero description..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Background Image</label>
                <ImageUpload value={homeHero.backgroundImage} onChange={(id) => setHomeHeroField("backgroundImage", id)} label="Hero Image" />
              </div>
            </div>
          </section>

          {/* Trek Selectors */}
          <FeaturedTrekSelector
            treks={treks}
            initialFeaturedIds={initialFeaturedIds}
            initialFeaturedSectionIds={initialFeaturedSectionIds}
          />

          {/* Section Headings */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Section Headings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Featured Treks Heading</label>
                <input value={homeSections.featuredTreksHeading} onChange={(e) => setHomeSectionField("featuredTreksHeading", e.target.value)} placeholder="Featured Treks" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Featured Treks Description</label>
                <input value={homeSections.featuredTreksDescription} onChange={(e) => setHomeSectionField("featuredTreksDescription", e.target.value)} placeholder="Description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Best Selling Heading</label>
                <input value={homeSections.bestSellingTreksHeading} onChange={(e) => setHomeSectionField("bestSellingTreksHeading", e.target.value)} placeholder="Best Selling Treks" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Best Selling Description</label>
                <input value={homeSections.bestSellingTreksDescription} onChange={(e) => setHomeSectionField("bestSellingTreksDescription", e.target.value)} placeholder="Description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Top Rated Heading</label>
                <input value={homeSections.topRatedTreksHeading} onChange={(e) => setHomeSectionField("topRatedTreksHeading", e.target.value)} placeholder="Top Rated Treks" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Top Rated Description</label>
                <input value={homeSections.topRatedTreksDescription} onChange={(e) => setHomeSectionField("topRatedTreksDescription", e.target.value)} placeholder="Description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reviews Heading</label>
                <input value={homeSections.reviewsHeading} onChange={(e) => setHomeSectionField("reviewsHeading", e.target.value)} placeholder="Guest Reviews" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reviews Description</label>
                <input value={homeSections.reviewsDescription} onChange={(e) => setHomeSectionField("reviewsDescription", e.target.value)} placeholder="Description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Blog Heading</label>
                <input value={homeSections.blogHeading} onChange={(e) => setHomeSectionField("blogHeading", e.target.value)} placeholder="Latest from Blog" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Blog Description</label>
                <input value={homeSections.blogDescription} onChange={(e) => setHomeSectionField("blogDescription", e.target.value)} placeholder="Description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Why Choose Us</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Heading</label>
                <input value={homeWhy.heading} onChange={(e) => setHomeWhy((prev: any) => ({ ...prev, heading: e.target.value }))} placeholder="Why Trek With Us?" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Subtitle</label>
                <input value={homeWhy.subtitle} onChange={(e) => setHomeWhy((prev: any) => ({ ...prev, subtitle: e.target.value }))} placeholder="Subtitle" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Background Image</label>
                <ImageUpload value={homeWhy.bgImage} onChange={(id) => setHomeWhy((prev: any) => ({ ...prev, bgImage: id }))} label="Background Image" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-slate-500">Feature Items</p>
              {homeWhy.items.map((item: any, i: number) => (
                <div key={i} className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <select value={item.icon} onChange={(e) => updateHomeWhyItem(i, "icon", e.target.value)} className="rounded border border-slate-200 px-2 py-1.5 text-sm">
                    {["Shield", "Heart", "Award", "Globe", "Users", "Mountain", "Compass", "Leaf", "Star", "Smile"].map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <input value={item.title} onChange={(e) => updateHomeWhyItem(i, "title", e.target.value)} placeholder="Title" className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  <input value={item.description} onChange={(e) => updateHomeWhyItem(i, "description", e.target.value)} placeholder="Description" className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => removeHomeWhyItem(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={addHomeWhyItem} className="text-xs text-teal-600 hover:text-teal-700">+ Add item</button>
            </div>
          </section>

          {/* Contact Section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Contact Section (Homepage)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Heading</label>
                <input value={homeContact.heading} onChange={(e) => setHomeContact((prev: any) => ({ ...prev, heading: e.target.value }))} placeholder="Get in Touch" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea rows={2} value={homeContact.description} onChange={(e) => setHomeContact((prev: any) => ({ ...prev, description: e.target.value }))} placeholder="Contact description..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-slate-500">Info Cards</p>
              {homeContact.infoCards.map((card: any, i: number) => (
                <div key={i} className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <input value={card.title} onChange={(e) => updateHomeInfoCard(i, "title", e.target.value)} placeholder="Title" className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  <input value={card.description} onChange={(e) => updateHomeInfoCard(i, "description", e.target.value)} placeholder="Description" className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => removeHomeInfoCard(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={addHomeInfoCard} className="text-xs text-teal-600 hover:text-teal-700">+ Add info card</button>
            </div>
          </section>
        </div>
      )}

      {/* ───────────── ABOUT TAB ───────────── */}
      {activeTab === "about" && (
        <div className="space-y-8">
          {/* SEO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">SEO / Meta</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meta Title</label>
                <input value={aboutSeo.title} onChange={(e) => setAboutSeo({ ...aboutSeo, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meta Description</label>
                <textarea rows={2} value={aboutSeo.description} onChange={(e) => setAboutSeo({ ...aboutSeo, description: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Keywords</label>
                <input value={aboutSeo.keywords} onChange={(e) => setAboutSeo({ ...aboutSeo, keywords: e.target.value })} placeholder="about, mardi treks, nepal, team" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Hero */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Hero Section</h3>
            <div className="space-y-3">
              <input value={aboutHero.heading} onChange={(e) => setAboutHero({ ...aboutHero, heading: e.target.value })} placeholder="Heading" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <textarea rows={3} value={aboutHero.description} onChange={(e) => setAboutHero({ ...aboutHero, description: e.target.value })} placeholder="Description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <ImageUpload value={aboutHero.backgroundImage} onChange={(id) => setAboutHero({ ...aboutHero, backgroundImage: id })} label="Background Image" />
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Why Choose Us</h3>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={aboutWhy.heading} onChange={(e) => setAboutWhy({ ...aboutWhy, heading: e.target.value })} placeholder="Heading" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input value={aboutWhy.subtitle} onChange={(e) => setAboutWhy({ ...aboutWhy, subtitle: e.target.value })} placeholder="Subtitle" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <ImageUpload value={aboutWhy.bgImage} onChange={(id) => setAboutWhy({ ...aboutWhy, bgImage: id })} label="Background Image (optional)" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Items</p>
                {aboutWhy.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex-1 space-y-1.5">
                      <input value={item.title} onChange={(e) => {
                        const next = [...aboutWhy.items];
                        next[i] = { ...next[i], title: e.target.value };
                        setAboutWhy({ ...aboutWhy, items: next });
                      }} placeholder="Title" className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
                      <textarea rows={2} value={item.description} onChange={(e) => {
                        const next = [...aboutWhy.items];
                        next[i] = { ...next[i], description: e.target.value };
                        setAboutWhy({ ...aboutWhy, items: next });
                      }} placeholder="Description" className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
                    </div>
                    <button type="button" onClick={() => setAboutWhy({ ...aboutWhy, items: aboutWhy.items.filter((_: any, idx: number) => idx !== i) })}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setAboutWhy({ ...aboutWhy, items: [...aboutWhy.items, { icon: "Award", title: "", description: "" }] })}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600">
                  + Add item
                </button>
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Team Members</h3>
            <div className="space-y-3">
              {aboutTeam.map((member: any, i: number) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex-1 grid gap-2 sm:grid-cols-2">
                    <input value={member.name} onChange={(e) => {
                      const next = [...aboutTeam]; next[i] = { ...next[i], name: e.target.value }; setAboutTeam(next);
                    }} placeholder="Name" className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
                    <input value={member.role} onChange={(e) => {
                      const next = [...aboutTeam]; next[i] = { ...next[i], role: e.target.value }; setAboutTeam(next);
                    }} placeholder="Role" className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  </div>
                  <button type="button" onClick={() => setAboutTeam(aboutTeam.filter((_: any, idx: number) => idx !== i))}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setAboutTeam([...aboutTeam, { name: "", role: "", image: "" }])}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600">
                + Add team member
              </button>
            </div>
          </section>

          {/* Gallery (Legal Documents) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Gallery / Legal Documents</h3>
            <div className="space-y-3">
              {aboutGallery.map((item: any, i: number) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">Item {i + 1}</span>
                    <button type="button" onClick={() => setAboutGallery(aboutGallery.filter((_: any, idx: number) => idx !== i))}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="space-y-2">
                    <ImageUpload value={item.imageId} onChange={(id) => {
                      const next = [...aboutGallery]; next[i] = { ...next[i], imageId: id }; setAboutGallery(next);
                    }} label="Photo" />
                    <input value={item.caption || ""} onChange={(e) => {
                      const next = [...aboutGallery]; next[i] = { ...next[i], caption: e.target.value }; setAboutGallery(next);
                    }} placeholder="Caption" className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setAboutGallery([...aboutGallery, { imageId: "", caption: "" }])}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600">
                + Add image
              </button>
            </div>
          </section>

          {/* Custom Sections */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Custom Sections</h3>
            <div className="space-y-3">
              {aboutSections.map((sec, i) => (
                <div key={sec.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">Section {i + 1}</span>
                    <button type="button" onClick={() => setAboutSections(aboutSections.filter((_, idx) => idx !== i))}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="space-y-2">
                    <input value={sec.heading} onChange={(e) => {
                      const next = [...aboutSections]; next[i] = { ...next[i], heading: e.target.value }; setAboutSections(next);
                    }} placeholder="Section heading" className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
                    <textarea rows={3} value={sec.description} onChange={(e) => {
                      const next = [...aboutSections]; next[i] = { ...next[i], description: e.target.value }; setAboutSections(next);
                    }} placeholder="Description / content" className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setAboutSections([...aboutSections, { id: String(Date.now()), type: "custom", heading: "", description: "" }])}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600">
                + Add custom section
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ───────────── CONTACT TAB ───────────── */}
      {activeTab === "contact" && (
        <div className="space-y-8">
          {/* SEO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">SEO / Meta</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meta Title</label>
                <input value={contactSeo.title} onChange={(e) => setContactSeo({ ...contactSeo, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meta Description</label>
                <textarea rows={2} value={contactSeo.description} onChange={(e) => setContactSeo({ ...contactSeo, description: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Keywords</label>
                <input value={contactSeo.keywords} onChange={(e) => setContactSeo({ ...contactSeo, keywords: e.target.value })} placeholder="contact, mardi treks, nepal, support" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Hero */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Hero Section</h3>
            <div className="space-y-3">
              <input value={contactHero.heading} onChange={(e) => setContactHero({ ...contactHero, heading: e.target.value })} placeholder="Heading" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <textarea rows={3} value={contactHero.description} onChange={(e) => setContactHero({ ...contactHero, description: e.target.value })} placeholder="Description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <ImageUpload value={contactHero.backgroundImage} onChange={(id) => setContactHero({ ...contactHero, backgroundImage: id })} label="Background Image" />
            </div>
          </section>

          {/* Map Iframe */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Google Map</h3>
            <textarea rows={4} value={contactMapIframe} onChange={(e) => setContactMapIframe(e.target.value)}
              placeholder='Paste the Google Maps iframe embed code here. e.g. &lt;iframe src="https://www.google.com/maps/embed?pb=..."&gt;&lt;/iframe&gt;'
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono" />
          </section>

          {/* Info Cards */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Contact Info Cards</h3>
            <div className="space-y-3">
              {contactInfoCards.map((card: any, i: number) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex-1 grid gap-2 sm:grid-cols-2">
                    <input value={card.title} onChange={(e) => {
                      const next = [...contactInfoCards]; next[i] = { ...next[i], title: e.target.value }; setContactInfoCards(next);
                    }} placeholder="Title (e.g. Email Us)" className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
                    <input value={card.description} onChange={(e) => {
                      const next = [...contactInfoCards]; next[i] = { ...next[i], description: e.target.value }; setContactInfoCards(next);
                    }} placeholder="Value (e.g. info@marditreks.com)" className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
                  </div>
                  <button type="button" onClick={() => setContactInfoCards(contactInfoCards.filter((_: any, idx: number) => idx !== i))}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setContactInfoCards([...contactInfoCards, { icon: "Info", title: "", description: "" }])}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600">
                + Add info card
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ───────────── BLOG TAB ───────────── */}
      {activeTab === "blog" && (
        <div className="space-y-8">
          {/* SEO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">SEO / Meta</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meta Title</label>
                <input value={blogSeo.title} onChange={(e) => setBlogSeo({ ...blogSeo, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meta Description</label>
                <textarea rows={2} value={blogSeo.description} onChange={(e) => setBlogSeo({ ...blogSeo, description: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Keywords</label>
                <input value={blogSeo.keywords} onChange={(e) => setBlogSeo({ ...blogSeo, keywords: e.target.value })} placeholder="trekking blog, nepal travel, himalayas" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Hero */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Hero Section</h3>
            <div className="space-y-3">
              <input value={blogHero.heading} onChange={(e) => setBlogHero({ ...blogHero, heading: e.target.value })} placeholder="Heading" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <textarea rows={3} value={blogHero.description} onChange={(e) => setBlogHero({ ...blogHero, description: e.target.value })} placeholder="Description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <ImageUpload value={blogHero.backgroundImage} onChange={(id) => setBlogHero({ ...blogHero, backgroundImage: id })} label="Background Image" />
            </div>
          </section>
        </div>
      )}

      {/* ───────────── FOOTER TAB ───────────── */}
      {activeTab === "footer" && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Footer Content</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Brand Description</label>
                <textarea rows={3} value={footer.brandDescription} onChange={(e) => setFooterField("brandDescription", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input value={footer.email} onChange={(e) => setFooterField("email", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                  <input value={footer.phone} onChange={(e) => setFooterField("phone", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                  <input value={footer.address} onChange={(e) => setFooterField("address", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Copyright Text</label>
                <input value={footer.copyright} onChange={(e) => setFooterField("copyright", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Social Links</h3>
            <div className="space-y-3">
              {footer.socialLinks.map((link: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-24 text-xs font-medium text-slate-500 capitalize">{link.platform}</span>
                  <input value={link.url} onChange={(e) => {
                    const next = [...footer.socialLinks]; next[i] = { ...next[i], url: e.target.value }; setFooterField("socialLinks", next);
                  }} placeholder="https://..." className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          <Save className="h-4 w-4" /> Save All Pages
        </button>
      </div>
    </form>
  );
}
