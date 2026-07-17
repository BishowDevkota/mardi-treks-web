"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Mountain, Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";

interface CategoryNav {
  name: string;
  slug: string;
  icon: string | null;
}

export function Header({ categories }: { categories?: CategoryNav[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const { data: session } = useSession();

  const navigation = [
    ...(categories && categories.length > 0
      ? categories.map((cat) => ({ label: cat.name, href: `/${cat.slug}` }))
      : [{ label: "Treks", href: "/treks" }]),
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <Mountain className="h-7 w-7" />
          <span>Mardi Treks</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Actions - Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {session?.user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-error"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
              <span className="text-sm text-slate-500">
                {session.user.name || session.user.email}
              </span>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary"
              >
                <User className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-slate-600 md:hidden"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-border bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-surface-alt hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-surface-alt"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { setIsMenuOpen(false); signOut(); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-surface-alt"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-surface-alt"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
