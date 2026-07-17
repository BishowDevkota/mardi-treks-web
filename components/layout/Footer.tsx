import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Mountain, Mail, Phone, MapPin } from "lucide-react";

export async function Footer() {
  const categories = await prisma.category.findMany({
    where: { status: "published" },
    orderBy: { sort: "asc" },
    select: { name: true, slug: true, icon: true },
  });

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
            <p className="text-sm leading-relaxed text-slate-400">
              Premier trekking and tour agency in Nepal. Experience the Himalayas with expert guides, sustainable practices, and unforgettable adventures.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {cat.icon} {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/blog" className="text-sm text-slate-400 transition-colors hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-slate-400 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-slate-400 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Regions */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Popular Regions
            </h3>
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
                    <Link
                      href={`/${catSlug}?region=${region.slug}`}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {region.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                <span>info@marditreks.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                <span>+977-1-4XXXXXX</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-light" />
                <span>Kathmandu, Nepal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Mardi Treks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
