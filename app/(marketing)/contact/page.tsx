import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Mail, Phone, MapPin, Clock, Send, Mountain } from "lucide-react";
import { ContactFormSection } from "@/components/home/ContactFormSection";

export const revalidate = 300;

const iconMap: Record<string, any> = { Mail, Phone, MapPin, Clock, Send, Mountain };

async function getPageContent() {
  const settings = await prisma.siteSetting.findUnique({ where: { id: "site-settings" } });
  const raw = (settings as any)?.pageContent;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const pc = await getPageContent();
  const contact = pc?.contact;
  return {
    title: contact?.seo?.title || "Contact Us",
    description: contact?.seo?.description || "Get in touch with Mardi Treks.",
  };
}

export default async function ContactPage() {
  const pc = await getPageContent();
  const contact = pc?.contact || {};
  const hero = contact.hero || {};
  const infoCards = contact.infoCards || [];
  const mapIframe = contact.mapIframe || "";

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative flex items-center py-16"
        style={hero.backgroundImage ? {
          backgroundImage: `url(https://res.cloudinary.com/dk7ggjvlw/image/upload/${hero.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}}
      >
        {hero.backgroundImage && <div className="absolute inset-0 bg-black/50" />}
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Mountain className="mx-auto h-12 w-12 text-primary-light" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {hero.heading || "Contact Us"}
          </h1>
          {hero.description && (
            <p className="mt-4 text-lg text-slate-300">{hero.description}</p>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
