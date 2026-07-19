"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Mountain, Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";

interface CategoryNav {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface DropdownTrek {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  region?: string | null;
  regionId?: string | null;
  regionRef?: { id: string; name: string; slug: string } | null;
}

interface RegionInfo {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export function Header({
  categories,
  siteLogo,
  navigation,
  categoryDropdownTreks,
  dropdownTreks,
  allRegions,
  topBarContent,
}: {
  categories?: CategoryNav[];
  siteLogo?: string | null;
  navigation?: { label: string; href: string }[];
  categoryDropdownTreks?: Record<string, string[]>;
  dropdownTreks?: DropdownTrek[];
  allRegions?: RegionInfo[];
  topBarContent?: string | null;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();

  // Scroll tracking with hysteresis + rAF throttling.
  // Wide gap (30px to leave the top, 100px to re-enter) means a scroll
  // position hovering anywhere in between can't cause rapid toggling.
  // rAF coalesces bursts of scroll events into one state check per frame.
  const tickingRef = useRef(false);

  useEffect(() => {
    function evaluate() {
      const y = window.scrollY;
      setIsScrolled((prev) => (prev ? y > 30 : y > 100));
      tickingRef.current = false;
    }
    function handleScroll() {
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(evaluate);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    evaluate();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when hovering away
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDropdownEnter(href: string) {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setHoveredDropdown(href);
  }

  function handleDropdownLeave() {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredDropdown(null);
    }, 150);
  }

  // Build nav items — always include published categories, merge with saved navigation
  const categoryNavItems = (categories && categories.length > 0
    ? categories.map((cat) => ({ label: cat.name, href: `/${cat.slug}` }))
    : [{ label: "Treks", href: "/treks" }]
  ) as { label: string; href: string }[];

  const extraNavItems = (navigation && navigation.length > 0
    ? navigation.filter((n: { label: string; href: string }) => !n.href.startsWith("/treks") && !categories?.some((c) => `/${c.slug}` === n.href))
    : [
        { label: "Blog", href: "/blog" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ]
  ) as { label: string; href: string }[];

  const navItems = [...categoryNavItems, ...extraNavItems];

  function getDropdownTreksForHref(href: string): DropdownTrek[] {
    const slug = href.replace(/^\//, "");
    const selectedIds = categoryDropdownTreks?.[slug];
    if (!selectedIds || selectedIds.length === 0) return [];
    return (dropdownTreks || []).filter((t) => selectedIds.includes(t.id));
  }

  // Group treks by region for a given nav href
  function getTreksGroupedByRegion(href: string): { region: string; treks: DropdownTrek[] }[] {
    const slug = href.replace(/^\//, "");
    const selectedIds = categoryDropdownTreks?.[slug];
    if (!selectedIds || selectedIds.length === 0) return [];

    const catTreks = (dropdownTreks || []).filter((t) => selectedIds.includes(t.id));
    const catRegions = (allRegions || []).filter((r) => r.categoryId === categories?.find((c) => c.slug === slug)?.id);

    const grouped: Record<string, DropdownTrek[]> = {};
    for (const trek of catTreks) {
      const regionName = trek.regionRef?.name || trek.region || "Other";
      if (!grouped[regionName]) grouped[regionName] = [];
      grouped[regionName].push(trek);
    }

    const regionOrder = catRegions.map((r) => r.name);
    return Object.entries(grouped)
      .sort(([a], [b]) => {
        const ai = regionOrder.indexOf(a);
        const bi = regionOrder.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
      .map(([region, treks]) => ({ region, treks }));
  }

  // The "tall, logo spans both rows" layout only ever applies when there IS
  // a top bar to share space with, and only while at the top of the page.
  // No top bar, or scrolled -> always the normal compact header.
  const showExpanded = Boolean(topBarContent) && !isScrolled;

  const logoContent = siteLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/${siteLogo}`}
      alt="Mardi Treks"
      className={`object-contain transition-all duration-200 ease-out ${
        showExpanded ? "h-24 max-w-[240px]" : "h-10 max-w-[140px]"
      }`}
    />
  ) : (
    <div className={`flex items-center gap-2 font-bold text-primary transition-all duration-200 ease-out ${showExpanded ? "text-3xl" : "text-xl"}`}>
      <Mountain className={`transition-all duration-200 ease-out ${showExpanded ? "h-10 w-10" : "h-7 w-7"}`} />
      <span>Mardi Treks</span>
    </div>
  );

  // Nav is absolutely centered within its row, independent of how wide the
  // logo or the auth actions are — this is what keeps it dead-center in
  // both the expanded (with top bar) and compact (scrolled) layouts.
  const desktopNav = (
    <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
      {navItems.map((item) => {
        const groupedTreks = getTreksGroupedByRegion(item.href);
        const hasDropdown = groupedTreks.length > 0;
        const isHovered = hoveredDropdown === item.href;

        if (!hasDropdown) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative rounded-lg px-3.5 py-2 text-[14.5px] font-medium text-slate-600 transition-colors hover:text-primary"
            >
              {item.label}
              <span className="pointer-events-none absolute inset-x-3 bottom-1 h-px scale-x-0 bg-primary transition-transform duration-200 ease-out group-hover:scale-x-100" />
            </Link>
          );
        }

        return (
          <div
            key={item.href}
            className="relative"
            onMouseEnter={() => handleDropdownEnter(item.href)}
            onMouseLeave={handleDropdownLeave}
          >
            <Link
              href={item.href}
              className="group inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-[14.5px] font-medium text-slate-600 transition-colors hover:text-primary"
            >
              {item.label}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isHovered ? "rotate-180" : ""}`} />
              <span className="pointer-events-none absolute inset-x-3 bottom-1 h-px scale-x-0 bg-primary transition-transform duration-200 ease-out group-hover:scale-x-100" />
            </Link>

            {isHovered && (
              <div
                onMouseEnter={() => handleDropdownEnter(item.href)}
                onMouseLeave={handleDropdownLeave}
                className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-2xl bg-surface p-3 shadow-xl ring-1 ring-black/5"
                style={{ minWidth: `${Math.max(groupedTreks.length * 200, 200)}px` }}
              >
                <div className="flex gap-4">
                  {groupedTreks.map((group) => (
                    <div key={group.region} className="min-w-[180px] flex-1">
                      <p className="mb-1 px-2 pb-1.5 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        {group.region}
                      </p>
                      <div className="space-y-0.5">
                        {group.treks.map((trek) => (
                          <Link
                            key={trek.id}
                            href={`/${item.href.replace(/^\//, "")}/${trek.slug}`}
                            onClick={() => setHoveredDropdown(null)}
                            className="block rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-surface-alt hover:text-primary"
                          >
                            {trek.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const authActions = (
    <div className="ml-auto hidden items-center gap-4 md:flex">
      {session?.user ? (
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-600 transition-colors hover:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="h-4 w-px" />
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-600 transition-colors hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
          <span className="hidden truncate max-w-[140px] text-[13px] text-slate-400 lg:inline">
            {session.user.name || session.user.email}
          </span>
        </div>
      ) : (
        <>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-600 transition-colors hover:text-primary"
          >
            <User className="h-4 w-4" />
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-4 py-2 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            Sign Up
          </Link>
        </>
      )}
    </div>
  );

  const mobileMenuButton = (
    <button
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      className="ml-auto rounded-lg p-2 text-slate-600 transition-colors hover:bg-surface-alt md:hidden"
      aria-label="Toggle menu"
    >
      {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  );

  return (
    <div
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      {showExpanded ? (
        // Expanded layout: logo spans both the top-bar row and the nav row.
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr] gap-x-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="row-span-2 flex items-center py-2">
            {logoContent}
          </Link>

<div className="flex items-center justify-end py-1.5">
  <div
    className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-[11.5px] leading-relaxed text-text-muted [&_a]:font-medium [&_a]:text-primary [&_a]:transition-opacity [&_a]:hover:opacity-75"
    dangerouslySetInnerHTML={{ __html: topBarContent || "" }}
  />
</div>

          <div className="relative flex items-center py-3.5">
            {desktopNav}
            {authActions}
            {mobileMenuButton}
          </div>
        </div>
      ) : (
        // Compact layout: used when scrolled, OR when there's no top bar at all.
        <div className="relative mx-auto flex max-w-7xl items-center px-4 py-2.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {logoContent}
          </Link>
          {desktopNav}
          {authActions}
          {mobileMenuButton}
        </div>
      )}

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const groupedTreks = getTreksGroupedByRegion(item.href);
              const hasDropdown = groupedTreks.length > 0;
              const isOpen = hoveredDropdown === `mobile-${item.href}`;

              return (
                <div key={item.href}>
                  {hasDropdown ? (
                    <>
                      <button
                        onClick={() => setHoveredDropdown(isOpen ? null : `mobile-${item.href}`)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-surface-alt"
                      >
                        <Link href={item.href} onClick={() => setIsMenuOpen(false)}>
                          {item.label}
                        </Link>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="ml-4 mt-1 space-y-3 pl-3">
                          {groupedTreks.map((group) => (
                            <div key={group.region}>
                              <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                {group.region}
                              </p>
                              <div className="space-y-0.5">
                                {group.treks.map((trek) => (
                                  <Link
                                    key={trek.id}
                                    href={`/${item.href.replace(/^\//, "")}/${trek.slug}`}
                                    onClick={() => { setHoveredDropdown(null); setIsMenuOpen(false); }}
                                    className="block rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-surface-alt hover:text-primary"
                                  >
                                    {trek.title}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-surface-alt hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}

            {session?.user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-surface-alt">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button onClick={() => { setIsMenuOpen(false); signOut(); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-surface-alt">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-surface-alt">
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="rounded-full bg-primary px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-dark">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}