import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Mail, Phone, MapPin, Clock, Send, Mountain } from "lucide-react";
import { ContactFormSection } from "@/components/home/ContactFormSection";
import { PageHero } from "@/components/layout/PageHero";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis";

export const revalidate = 300;

const iconMap: Record<string, any> = { Mail, Phone, MapPin, Clock, Send, Mountain };

async function getPageContent() {
  const raw = await getCachedOrFetch<string | null>(
    "site:page-content",
    async () => {
      const settings = await prisma.siteSetting.findUnique({ where: { id: "site-settings" } });
      return (settings as any)?.pageContent || null;
    },
    300
  );
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
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

export default async function ContactPage() {
  const pc = await getPageContent();
  const contact = pc?.contact || {};
  const hero = contact.hero || {};
  const infoCards = contact.infoCards || [];
  const mapIframe = contact.mapIframe || "";

  // Fetch treks for the search bar
  const allTreksForSearch = await getCachedOrFetch(
    cacheKeys.searchTreks,
    () => prisma.trek.findMany({
      where: { status: "published" },
      select: { title: true, slug: true, region: true, difficulty: true, duration: true, category: { select: { slug: true } } },
      orderBy: { title: "asc" },
    }),
    300
  );

  return (
    <>
      <PageHero
        heading={hero.heading || "Contact Us"}
        description={hero.description}
        backgroundImage={hero.backgroundImage}
        treks={allTreksForSearch}
      />

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div>
              <ContactFormSection
                heading="Send us a message"
                description="Fill in the form below and we'll get back to you within 24 hours."
              />
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">Get in touch</h2>
              <div className="mt-6 space-y-6">
                {infoCards.map((card: any, i: number) => {
                  const Icon = iconMap[card.icon] || MapPin;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{card.title}</h3>
                        <p className="mt-1 text-sm text-text-muted">{card.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Map */}
              {mapIframe ? (
                <div className="mt-8 overflow-hidden rounded-xl border border-border" dangerouslySetInnerHTML={{ __html: mapIframe }} />
              ) : (
                <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface p-8 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-primary/50" />
                  <p className="mt-2 text-sm text-text-muted">Map location</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
