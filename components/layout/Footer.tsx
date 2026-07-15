import Link from "next/link";
import { Mountain, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
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

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { label: "All Treks", href: "/treks" },
                { label: "Blog", href: "/blog" },
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trek Regions */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Popular Regions
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Everest Region", href: "/treks?region=everest" },
                { label: "Annapurna Region", href: "/treks?region=annapurna" },
                { label: "Langtang Region", href: "/treks?region=langtang" },
                { label: "Mustang Region", href: "/treks?region=mustang" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
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
