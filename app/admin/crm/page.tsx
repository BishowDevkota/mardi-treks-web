import Link from "next/link";
import { BookOpen, Mail, Settings, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function CrmDashboard() {
  const [
    totalBookings,
    pendingBookings,
    totalUsers,
    totalContacts,
    receivedEmails,
    recentBookings,
    recentContacts,
    recentEmails,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.user.count(),
    prisma.crmContact.count(),
    prisma.crmEmailLog.count({ where: { direction: "received" } }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.crmContact.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.crmEmailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { contact: { select: { name: true } } },
    }),
  ]);

  const cards = [
    {
      label: "Bookings",
      value: totalBookings,
      detail: `${pendingBookings} awaiting review`,
      href: "/admin/bookings",
      icon: BookOpen,
      style: "bg-blue-50 text-blue-600",
    },
    {
      label: "Users",
      value: totalUsers,
      detail: "Registered customers",
      href: "/admin/users",
      icon: Users,
      style: "bg-violet-50 text-violet-600",
    },
    {
      label: "Contacts",
      value: totalContacts,
      detail: "Customer contacts",
      href: "/admin/crm/contacts",
      icon: UserPlus,
      style: "bg-teal-50 text-teal-600",
    },
    {
      label: "Incoming emails",
      value: receivedEmails,
      detail: "Messages received",
      href: "/admin/crm/communication",
      icon: Mail,
      style: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            A simple overview of your customers, bookings, and communication
          </p>
        </div>
        <Link
          href="/admin/crm/contacts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Contact
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`inline-flex rounded-xl p-2.5 ${card.style}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
              <p className="mt-1 text-xs text-slate-400">{card.detail}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs font-medium text-teal-600">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentBookings.length ? recentBookings.map((booking) => (
              <div key={booking.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{booking.trekTitle}</p>
                    <p className="truncate text-xs text-slate-400">
                      {booking.user.name || booking.user.email}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    {booking.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            )) : <p className="px-5 py-8 text-center text-sm text-slate-400">No bookings yet</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Recent Contacts</h2>
            <Link href="/admin/crm/contacts" className="text-xs font-medium text-teal-600">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentContacts.length ? recentContacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{contact.name}</p>
                  <p className="truncate text-xs text-slate-400">{contact.email || contact.phone || "No contact details"}</p>
                </div>
              </div>
            )) : <p className="px-5 py-8 text-center text-sm text-slate-400">No contacts yet</p>}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Recent Communication</h2>
          <Link href="/admin/crm/communication" className="text-xs font-medium text-teal-600">Open inbox →</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentEmails.length ? recentEmails.map((email) => (
            <div key={email.id} className="flex items-center gap-3 px-5 py-3">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{email.subject}</p>
                <p className="truncate text-xs text-slate-400">{email.contact.name} · {email.direction}</p>
              </div>
            </div>
          )) : <p className="px-5 py-8 text-center text-sm text-slate-400">No emails yet</p>}
        </div>
      </section>

      <Link
        href="/admin/crm/settings"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-teal-700"
      >
        <Settings className="h-4 w-4" />
        CRM Settings
      </Link>
    </div>
  );
}
