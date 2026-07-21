import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Mountain, Shield, Heart, Award, Globe, Users } from "lucide-react";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import GallerySection from "@/components/trek/GallerySection";

export const revalidate = 300;

async function getPageContent() {
  const settings = await prisma.siteSetting.findUnique({
    where: { id: "site-settings" },
    select: { pageContent: true },
  });
  if (!settings?.pageContent) return null;
  try { return JSON.parse(settings.pageContent); } catch { return null; }
}

const iconMap: Record<string, any> = { Shield, Heart, Award, Globe, Users, Mountain };

export async function generateMetadata(): Promise<Metadata> {
  const pc = await getPageContent();
  const about = pc?.about;
  return {
    title: about?.seo?.title || "About Us",
    description: about?.seo?.description || "Learn about Mardi Treks — Nepal's premier trekking and tour agency.",
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
            {hero.heading || "About Mardi Treks"}
          </h1>
          {hero.description && (
            <p className="mt-4 text-lg text-slate-300">{hero.description}</p>
          )}
        </div>
      </section>

      {/* ── Custom Sections ── */}
      {sections.map((sec: any, i: number) => (
        <section key={sec.id || i} className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
