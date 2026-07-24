import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, UserPlus, Tags } from "lucide-react";
import { CrmContactsClient } from "./client";

export default async function CrmContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; tag?: string }>;
}) {
  const { q, type, tag: tagFilter } = await searchParams;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (type && type !== "all") {
    where.type = type;
  }
  if (tagFilter) {
    where.tags = { some: { tag: { name: tagFilter } } };
  }

  const [contacts, tags, totalCount, treks, allUsers, completedBookings] = await Promise.all([
    prisma.crmContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tags: { include: { tag: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.crmTag.findMany({ orderBy: { name: "asc" } }),
    prisma.crmContact.count(),
    prisma.trek.findMany({
      where: { status: "published" },
      select: { id: true, title: true, slug: true, duration: true, difficulty: true, region: true },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, nationality: true,
        createdAt: true, role: true,
        bookings: {
          where: { status: "COMPLETED" },
          select: { trekSlug: true, trekTitle: true, id: true },
        },
      },
    }),
    prisma.booking.findMany({
      where: { status: "COMPLETED" },
      select: { userId: true, trekSlug: true, trekTitle: true },
    }),
  ]);

  // Enrich CRM contacts with completed trek data
  const enrichedContacts = contacts.map((c) => {
    const completedIds: string[] = c.completedTrekIds ? JSON.parse(c.completedTrekIds) : [];
    const completedTreks = treks.filter((t) => completedIds.includes(t.id) || completedIds.includes(t.slug));
    return { ...c, completedTreks, _isVirtual: false };
  });

  // Build a map of user IDs that already have a CrmContact
  const existingContactUserIds = new Set(contacts.filter((c) => c.userId).map((c) => c.userId));

  // Create virtual contact entries for users without a CrmContact
  const virtualContacts = allUsers
    .filter((u) => !existingContactUserIds.has(u.id))
    .map((u) => {
      const userCompletedBookings = completedBookings.filter((b) => b.userId === u.id);
      const completedTrekSlugs = userCompletedBookings.map((b) => b.trekSlug);
      const completedTreks = treks.filter((t) => completedTrekSlugs.includes(t.slug));

      return {
        id: `user_${u.id}`,
        name: u.name || u.email?.split("@")[0] || "Unknown User",
        email: u.email,
        phone: u.phone || null,
        company: null,
        position: null,
        type: "customer",
        source: "booking",
        status: "active",
        userId: u.id,
        completedTrekIds: JSON.stringify(completedTrekSlugs),
        completedTreks,
        autoTracked: completedTreks.length > 0,
        notes: null,
        createdAt: u.createdAt,
        tags: [],
        user: { name: u.name, email: u.email },
        _isVirtual: true,
      };
    });

  // Apply search/filter to virtual contacts too
  const filteredVirtual = virtualContacts.filter((vc) => {
    if (type && type !== "all" && type !== "customer") return false;
    if (q) {
      const ql = q.toLowerCase();
      if (!vc.name.toLowerCase().includes(ql) && !(vc.email || "").toLowerCase().includes(ql)) return false;
    }
    return true;
  });

  // Merge CRM contacts + virtual user contacts
  const mergedList = [...enrichedContacts, ...filteredVirtual];

  const stats = {
    total: mergedList.length,
    leads: mergedList.filter((c) => c.type === "lead").length,
    customers: mergedList.filter((c) => c.type === "customer").length,
    active: mergedList.filter((c) => c.status === "active").length,
    registeredUsers: allUsers.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="mt-1 text-sm text-slate-500">{stats.registeredUsers} registered users · {totalCount} CRM contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/crm/contacts/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-600 hover:to-teal-700">
            <UserPlus className="h-4 w-4" /> Add Contact
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2"><Users className="h-4 w-4 text-teal-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{stats.total}</p><p className="text-xs text-slate-500">Total People</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2"><Users className="h-4 w-4 text-blue-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{stats.registeredUsers}</p><p className="text-xs text-slate-500">Registered Users</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2"><UserPlus className="h-4 w-4 text-emerald-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{stats.customers}</p><p className="text-xs text-slate-500">Customers</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-50 p-2"><Tags className="h-4 w-4 text-violet-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{tags.length}</p><p className="text-xs text-slate-500">Tags</p></div>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <CrmContactsClient
        contacts={JSON.parse(JSON.stringify(mergedList))}
        tags={JSON.parse(JSON.stringify(tags))}
        treks={JSON.parse(JSON.stringify(treks))}
        currentType={type || "all"}
        currentTag={tagFilter || ""}
        searchQuery={q || ""}
        registeredUserCount={stats.registeredUsers}
      />
    </div>
  );
}
