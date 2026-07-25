import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Mail,
  MapPin,
  Mountain,
  Phone,
  MessageCircle,
  ChevronRight,
} from "lucide-react";

const CLOUDINARY_BASE = "https://res.cloudinary.com/dk7ggjvlw/image/upload/";

function imgSrc(src?: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${CLOUDINARY_BASE}${src}`;
}

function SocialIcon({ platform }: { platform: string }) {
  const className = "h-4 w-4";
  if (platform === "facebook")
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  if (platform === "instagram")
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  if (platform === "youtube")
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
      </svg>
    );
  return <span className="text-xs font-bold">𝕏</span>;
}

export async function Footer() {
  const latestBlogs = await prisma.blogPost.findMany({
    where: { status: "published" },
    orderBy: { publishedDate: "desc" },
    take: 4,
    select: { title: true, slug: true },
  });

  const settings = await prisma.siteSetting.findUnique({
    where: { id: "site-settings" },
    select: { pageContent: true, logo: true },
  });
  const siteLogo = settings?.logo || "";
  let footer: any = {};
  if (settings?.pageContent) {
    try {
      footer = JSON.parse(settings.pageContent).footer || {};
    } catch {}
  }

  const email = footer.email || "info@marditreks.com";
  const phone = footer.phone || "+977-1-4XXXXXX";
  const address = footer.address || "Kathmandu, Nepal";
  const socialLinks = footer.socialLinks && footer.socialLinks.length > 0 ? footer.socialLinks : [];
  const copyright = footer.copyright || `© ${new Date().getFullYear()} Mardi Treks. All rights reserved.`;

  const trustedBadge: string = footer.trustedBadge || "Trusted & Certified";
  const associatedHeading: string = footer.associatedHeading || "We're Associated With";
  const partners: { name: string; src: string }[] = footer.partners || [];
  const companyHeading: string = footer.companyHeading || "Company";
  const companyLinks: { label: string; href: string }[] = footer.companyLinks || [];
  const recommendedLabel: string = footer.recommendedLabel || "Recommended On:";
  const recommendedOn: { name: string; src: string }[] = footer.recommendedOn || [];
  const followUsLabel: string = footer.followUsLabel || "Follow Us On:";
  const card1Title: string = footer.card1Title || "Mardi Treks";
  const card2Title: string = footer.card2Title || "Speak with a Representative";
  const representative: { name?: string; title?: string; avatar?: string; phone?: string; whatsapp?: string } = footer.representative || {};
  const card3Title: string = footer.card3Title || "Recognitions";
  const recognitions: { name: string; src: string }[] = footer.recognitions || [];
  const bottomLinks: { label: string; href: string }[] = footer.bottomLinks || [];

  return (
    <footer className="relative mt-24">
      {/* ── Partners Strip ── */}
      <div className="bg-background py-14 text-center sm:py-16">
        <span
          className="mb-2 inline-block text-[11px] font-bold uppercase tracking-[0.28em]"
          style={{ color: "var(--color-primary)" }}
        >
          {trustedBadge}
        </span>
        <h3 className="mb-8 text-xl font-bold text-foreground">
          {associatedHeading}
        </h3>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-5 px-4">
          {partners.map((p) => (
            <div
              key={p.name}
              className="group flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-surface p-3 shadow-sm grayscale transition-all duration-300 hover:-translate-y-1 hover:grayscale-0 hover:shadow-md"
              style={{ borderColor: "var(--color-border)" }}
            >
              {p.src ? (
                <img
                  src={imgSrc(p.src)}
                  alt={p.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mountain Banner SVG ── */}
      <div
        className="pointer-events-none h-[clamp(120px,14.2vw,272px)] overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/images/footer/footer-illustrator.svg"
          alt=""
          className="h-full w-full object-cover object-bottom"
        />
      </div>

      {/* ── Footer Main ── */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: "var(--color-footer)" }}
      >
        {/* ambient texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, var(--color-primary) 0%, transparent 35%), radial-gradient(circle at 85% 75%, var(--color-primary) 0%, transparent 40%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-14 sm:px-8 lg:px-10 lg:pt-20">
          {/* 4-column grid */}
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
            {/* Brand */}
            <div>
              <Link
                href="/"
                className="mb-5 inline-flex items-center gap-3"
                style={{ color: "var(--color-footer-text)" }}
              >
                {siteLogo ? (
                  <img
                    src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/${siteLogo}`}
                    alt="Mardi Treks"
                    className="h-auto max-h-32 w-auto max-w-[320px] object-contain"
                  />
                ) : (
                  <span className="inline-flex items-center gap-3 text-xl font-bold">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-footer-text), rgba(255,255,255,0.85))",
                        color: "var(--color-primary)",
                      }}
                    >
                      <Mountain className="h-6 w-6" />
                    </span>
                    <span className="leading-tight">
                      Mardi Treks
                      <small
                        className="block text-[10px] font-semibold uppercase tracking-[0.22em]"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Trekking &amp; Travel
                      </small>
                    </span>
                  </span>
                )}
              </Link>
            </div>

            {/* Activities */}
            <div>
              <h3
                className="relative mb-6 inline-block text-sm font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--color-footer-text)" }}
              >
                Activities
                <span
                  className="absolute -bottom-2 left-0 h-[2px] w-6 rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
              </h3>
              <ul className="space-y-3.5 pt-1">
                {[
                  { label: "Treks", href: "/treks" },
                  { label: "Tours", href: "/tours" },
                  { label: "Climbing", href: "/climbing" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-2 text-sm transition-colors hover:text-[var(--color-primary)]"
                      style={{ color: "rgba(255,255,255,0.65)" }}
                    >
                      <ChevronRight
                        className="h-3 w-3 transition-transform group-hover:translate-x-1"
                        style={{ color: "var(--color-primary)" }}
                      />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3
                className="relative mb-6 inline-block text-sm font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--color-footer-text)" }}
              >
                {companyHeading}
                <span
                  className="absolute -bottom-2 left-0 h-[2px] w-6 rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
              </h3>
              <ul className="space-y-3.5 pt-1">
                {companyLinks.map((item: any) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-2 text-sm transition-colors hover:text-[var(--color-primary)]"
                      style={{ color: "rgba(255,255,255,0.65)" }}
                    >
                      <ChevronRight
                        className="h-3 w-3 transition-transform group-hover:translate-x-1"
                        style={{ color: "var(--color-primary)" }}
                      />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Latest Blogs */}
            <div>
              <h3
                className="relative mb-6 inline-block text-sm font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--color-footer-text)" }}
              >
                Latest Blogs
                <span
                  className="absolute -bottom-2 left-0 h-[2px] w-6 rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
              </h3>
              <ul className="space-y-3.5 pt-1">
                {latestBlogs.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group inline-flex items-start gap-2 text-sm transition-colors hover:text-[var(--color-primary)]"
                      style={{ color: "rgba(255,255,255,0.65)" }}
                    >
                      <ChevronRight
                        className="mt-0.5 h-3 w-3 shrink-0 transition-transform group-hover:translate-x-1"
                        style={{ color: "var(--color-primary)" }}
                      />
                      <span className="line-clamp-2">{post.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Recommended / Social Row ── */}
          <div
            className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-6"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-footer-text)" }}
              >
                {recommendedLabel}
              </span>
              <div className="flex items-center gap-4">
                {recommendedOn.map((item) => (
                  <div
                    key={item.name}
                    className="flex h-10 items-center justify-center rounded-md px-3 opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  >
                    <img
                      src={imgSrc(item.src)}
                      alt={item.name}
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-footer-text)" }}
                >
                  {followUsLabel}
                </span>
                <div className="flex items-center gap-2">
                  {socialLinks
                    .filter((link: any) => link.url)
                    .slice(0, 4)
                    .map((link: any, index: number) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.platform}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary)]"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.08)",
                          color: "var(--color-footer-text)",
                        }}
                      >
                        <SocialIcon platform={link.platform} />
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Info Cards ── */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 — Contact Info */}
            <div
              className="group flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h4
                className="mb-4 text-sm font-bold"
                style={{ color: "var(--color-footer-text)" }}
              >
                {card1Title}
              </h4>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <MapPin className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                  </span>
                  <span className="pt-1">{address}</span>
                </div>
                <div className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <Mail className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                  </span>
                  <span className="pt-1">{email}</span>
                </div>
                <div className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <Phone className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                  </span>
                  <span className="pt-1">{phone}</span>
                </div>
              </div>
            </div>

            {/* Card 2 — Representative */}
            <div
              className="group flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h4
                className="mb-4 text-sm font-bold"
                style={{ color: "var(--color-footer-text)" }}
              >
                {card2Title}
              </h4>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-2 text-center">
                <div
                  className="h-16 w-16 overflow-hidden rounded-full shadow-md"
                  style={{ border: "2px solid var(--color-primary)" }}
                >
                  <img
                    src={imgSrc(representative.avatar) || "https://placehold.co/128x128/D97757/ffffff?text=AS&font=montserrat"}
                    alt={representative.name || "Representative"}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--color-footer-text)" }}>
                    {representative.name || "Representative"}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {representative.title || ""}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${representative.phone || phone}`}
                  className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-colors hover:bg-[var(--color-primary)]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "var(--color-footer-text)",
                  }}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
                <a
                  href={`https://wa.me/${representative.whatsapp || "977"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-footer-text)",
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Chat
                </a>
              </div>
            </div>

            {/* Card 3 — Recognitions */}
            <div
              className="flex h-full flex-col rounded-2xl p-6"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h4
                className="mb-4 text-sm font-bold"
                style={{ color: "var(--color-footer-text)" }}
              >
                {card3Title}
              </h4>
              <div className="flex flex-1 gap-4">
                {recognitions.map((badge) => (
                  <div
                    key={badge.name}
                    className="flex-1 overflow-hidden rounded-lg shadow-md"
                    style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <img
                      src={imgSrc(badge.src)}
                      alt={badge.name}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom Bar ── */}
          <div
            className="mt-8 flex flex-col gap-4 border-t pt-5 text-xs sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <span>{copyright}</span>
            <div className="flex items-center gap-5">
              {bottomLinks.map((link: any, i: number) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="h-1 w-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />}
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-[var(--color-primary)]"
                    style={{ color: "inherit" }}
                  >
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

     
    </footer>
  );
}