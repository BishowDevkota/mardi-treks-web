import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mountain, Bell, FolderKanban, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileSidebar } from "@/components/admin/AdminMobileSidebar";

export const nav = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Home", href: "/admin/home", icon: "Home" },
  { label: "Treks", href: "/admin/treks", icon: "List" },
  { label: "Categories", href: "/admin/categories", icon: "FolderKanban" },
  { label: "Blog Posts", href: "/admin/blog", icon: "FileText" },
  { label: "Bookings", href: "/admin/bookings", icon: "ShoppingCart" },
  { label: "Reviews", href: "/admin/reviews", icon: "MessageSquare" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Media", href: "/admin/media", icon: "ImageIcon" },
  { label: "Pages", href: "/admin/pages", icon: "Calendar" },
  { label: "Page Manager", href: "/admin/page-manager", icon: "FileText" },
  { label: "Navigation", href: "/admin/navigation", icon: "Menu" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") redirect("/login?callbackUrl=/admin");

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <AdminSidebar
        nav={nav}
        userName={session.user.name || "Admin"}
        userEmail={session.user.email || ""}
        userInitial={(session.user.name || session.user.email || "A").charAt(0).toUpperCase()}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <AdminMobileSidebar nav={nav} userName={session.user.name || session.user.email || ""} />
          <div className="hidden sm:flex sm:flex-1" />
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-bold text-white shadow-sm">
                {(session.user.name || session.user.email || "A").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
