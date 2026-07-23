import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Mountain, Shield, Heart, Award, Globe, Users } from "lucide-react";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import GallerySection from "@/components/trek/GallerySection";
import { PageHero } from "@/components/layout/PageHero";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis";

export const revalidate = 300;

async function getPageContent() {
  const raw = await getCachedOrFetch<string | null>(
    "site:page-content",
    async () => {
      const settings = await prisma.siteSetting.findUnique({
        where: { id: "site-settings" },
        select: { pageContent: true },
      });
      return settings?.pageContent || null;
    },
    300
  );
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

const iconMap: Record<string, any> = { Shield, Heart, Award, Globe, Users, Mountain };

export async function generateMetadata(): Promise<Metadata> {
  const pc = await getPageContent();
  const about = pc?.about;
  const seo = about?.seo;
  return {
    title: seo?.title || "About Us",
    description: seo?.description || "Learn about Mardi Treks — Nepal's premier trekking and tour agency.",
    keywords: seo?.keywords || undefined,
    alternates: { canonical: "https://marditreks.com/about" },
  };
}

export default async function AboutPage() {
  const pc = await getPageContent();
  const about = pc?.about || {};
  const hero = about.hero || {};
  const sections = about.sections || [];
  const whyChooseUs = about.whyChooseUs || {};
  const team = about.team || [];
  const gallery = about.gallery || [];

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
        heading={hero.heading || "About Mardi Treks"}
        description={hero.description}
        backgroundImage={hero.backgroundImage}
        treks={allTreksForSearch}
      />

      {/* ── Custom Sections ── */}
      {sections.map((sec: any, i: number) => (
        <section key={sec.id || i} className="py-16">
          <div className="mx-auto max-w-3xl px-3 sm:px-4 lg:px-6">
            {sec.heading && <h2 className="text-2xl font-bold text-foreground">{sec.heading}</h2>}
            {sec.description && (
              <div className="mt-4 space-y-4 text-text leading-relaxed">
                <p>{sec.description}</p>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* ── Why Choose Us ── */}
      <WhyChooseUs
        heading={whyChooseUs.heading || "Why Trek With Us?"}
        subtitle={whyChooseUs.subtitle || "Discover the Difference"}
        items={whyChooseUs.items || []}
        bgImage={whyChooseUs.bgImage}
      />

      {/* ── Team ── */}
      {team.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
            <h2 className="text-center text-2xl font-bold text-foreground">Our Team</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    {member.image ? (
                      <Image src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/${member.image}`} alt={member.name} width={80} height={80} className="rounded-full object-cover" />
                    ) : (
                      <Users className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery / Legal Documents ── */}
      {gallery.length > 0 && (
        <section className="bg-surface py-16">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
            <GallerySection
              images={gallery}
              heading="Legal Documents"
              trekTitle="Mardi Treks"
            />
          </div>
        </section>
      )}
    </>
  );
}
