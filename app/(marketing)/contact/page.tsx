import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Mail, Phone, MapPin } from "lucide-react";
import { ContactFormSection } from "@/components/home/ContactFormSection";
import { PageHero } from "@/components/layout/PageHero";
import { getCachedOrFetch, cacheKeys, CACHE_TTL } from "@/lib/redis";
import { sanitizeIframeHtml } from "@/lib/sanitize";

export const revalidate = 3600;

async function getPageContent() {
  return getCachedOrFetch<Record<string, any> | null>(
    cacheKeys.pageContent,
    async () => {
      const settings = await prisma.siteSetting.findUnique({ where: { id: "site-settings" } });
      if (!(settings as any)?.pageContent) return null;
      try { return JSON.parse((settings as any).pageContent); } catch { return null; }
    },
    CACHE_TTL.PAGE_CONTENT
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const pc = await getPageContent();
  const contact = pc?.contact;
  const seo = contact?.seo;
  return {
    title: seo?.title || "Contact Us",
    description: seo?.description || "Get in touch with Mardi Treks.",
    keywords: seo?.keywords || undefined,
    alternates: { canonical: "https://marditreks.com/contact" },
  };
}

const contactDetails = [
  { icon: Mail, title: "Email Us", info: "info@marditreks.com" },
  { icon: Phone, title: "Call Us", info: "+977-1-2345678" },
  { icon: MapPin, title: "Office", info: "Thamel, Kathmandu, Nepal" },
];

export default async function ContactPage() {
  const pc = await getPageContent();
  const contact = pc?.contact || {};
  const hero = contact.hero || {};
  const mapIframe = contact.mapIframe || "";

  // Fetch treks for the search bar
  const allTreksForSearch = await getCachedOrFetch(
    cacheKeys.searchTreks,
    () => prisma.trek.findMany({
      where: { status: "published" },
      select: { title: true, slug: true, region: true, difficulty: true, duration: true, category: { select: { slug: true } } },
      orderBy: { title: "asc" },
    }),
    CACHE_TTL.MODERATE
  );

  return (
    <>
      <PageHero
        heading={hero.heading || "Contact Us"}
        description={hero.description}
        backgroundImage={hero.backgroundImage}
        treks={allTreksForSearch}
        breadcrumbLabel="Contact"
      />

      {/* Contact Form — full width, matches map/get-in-touch below */}
      <ContactFormSection
        heading="Send us a message"
        description="Fill in the form below and we'll get back to you within 24 hours."
      />

      {/* Map + Get in Touch — side by side */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Map (left) — stretches to full height of grid row */}
            <div className="h-full min-w-0">
              {mapIframe ? (
                <div className="iframe-responsive-container h-full min-h-[400px] overflow-hidden rounded-2xl border border-border shadow-sm [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:h-full [&_iframe]:min-h-[400px]" dangerouslySetInnerHTML={{ __html: sanitizeIframeHtml(mapIframe) }} />
              ) : (
                <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-border bg-surface shadow-sm">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-7 w-7 text-primary" />
                    </div>
                    <p className="mt-3 text-sm text-text-muted">Map location</p>
                  </div>
                </div>
              )}
            </div>

            {/* Get in Touch (right) */}
            <div className="flex h-full flex-col justify-center">
              <div
                className="relative overflow-hidden rounded-2xl p-8"
                style={{
                  background: "linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))",
                }}
              >
                {/* Decorative accent */}
                <div
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
                <div
                  className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-20"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />

                <div className="relative">
                  <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                    Contact Details
                  </span>
                  <h2 className="mt-4 text-2xl font-bold text-white">Get in touch</h2>
                  <p className="mt-1.5 text-sm text-white/70">
                    We&apos;re here to help plan your Himalayan adventure.
                  </p>

                  <div className="mt-6 space-y-5">
                    {contactDetails.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-colors hover:bg-white/15">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{item.title}</p>
                            <p className="text-sm font-medium text-white">{item.info}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
