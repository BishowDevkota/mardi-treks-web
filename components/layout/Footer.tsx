import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Mountain, Mail, Phone, MapPin } from "lucide-react";

function SocialIcon({ platform }: { platform: string }) {
  if (platform === "facebook") return <span className="text-xs font-bold">f</span>;
  if (platform === "instagram") return <span className="text-xs font-bold">ig</span>;
  if (platform === "twitter") return <span className="text-xs font-bold">𝕏</span>;
  if (platform === "youtube") return <span className="text-xs font-bold">▶</span>;
  return null;
}

export async function Footer() {
  const categories = await prisma.category.findMany({
    where: { status: "published" },
    orderBy: { sort: "asc" },
    select: { name: true, slug: true, icon: true },
  });

  const settings = await prisma.siteSetting.findUnique({
    where: { id: "site-settings" },
    select: { pageContent: true },
  });
  let footer: any = {};
  if (settings?.pageContent) {
    try { footer = JSON.parse(settings.pageContent).footer || {}; } catch {}
  }

  const brandDesc = footer.brandDescription || "Premier trekking and tour agency in Nepal. Experience the Himalayas with expert guides.";
  const email = footer.email || "info@marditreks.com";
  const phone = footer.phone || "+977-1-4XXXXXX";
  const address = footer.address || "Kathmandu, Nepal";
  const socialLinks = footer.socialLinks || [];
  const copyright = footer.copyright || `© ${new Date().getFullYear()} Mardi Treks. All rights reserved.`;

  return (
    <footer className="border-t border-border bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
              <Mountain className="h-6 w-6 text-primary-light" />
              <span>Mardi Treks</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">{brandDesc}</p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.filter((l: any) => l.url).map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-primary-light hover:text-white transition-colors text-xs">
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Explore</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/${cat.slug}`} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {cat.icon} {cat.name}
                  </Link>
                </li>
              ))}
              <li><Link href="/blog" className="text-sm text-slate-400 transition-colors hover:text-white">Blog</Link></li>
              <li><Link href="/about" className="text-sm text-slate-400 transition-colors hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-400 transition-colors hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Popular Regions */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Popular Regions</h3>
            <ul className="space-y-2">
              {[
                { label: "Everest Region", slug: "everest" },
                { label: "Annapurna Region", slug: "annapurna" },
                { label: "Langtang Region", slug: "langtang" },
                { label: "Mustang Region", slug: "mustang" },
              ].map((region) => {
                const catSlug = categories[0]?.slug || "treks";
                return (
                  <li key={region.label}>
                    <Link href={`/${catSlug}?region=${region.slug}`} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {region.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                <span>{email}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                <span>{phone}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-500">
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
