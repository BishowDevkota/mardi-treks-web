"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu, X, Mountain, LayoutDashboard, List, FileText,
  ShoppingCart, Users, ImageIcon, Calendar, Settings
} from "lucide-react";

const iconMap: Record<string, any> = {
  LayoutDashboard, List, FileText, ShoppingCart,
  Users, ImageIcon, Calendar, Settings,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export function AdminMobileSidebar({ nav, userName }: { nav: NavItem[]; userName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = iconMap[item.icon];
    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          isActive(item.href)
            ? "bg-teal-50 text-teal-700"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        }`}
      >
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          isActive(item.href) ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-400"
        }`}>
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm">
                  <Mountain className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-900">Mardi CMS</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Main Menu</p>
              {nav.slice(0, 4).map((item) => <NavLink key={item.href} item={item} />)}
              <p className="mt-5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Management</p>
              {nav.slice(4).map((item) => <NavLink key={item.href} item={item} />)}
            </div>

            <div className="border-t border-slate-200 px-3 py-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
              </div>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <Mountain className="h-3.5 w-3.5" />
                View Site
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
