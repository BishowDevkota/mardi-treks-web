"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// ==============================
// CONTACT ACTIONS
// ==============================

export async function createContact(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const userId = (formData.get("userId") as string) || null;
  const completedTrekIds = (formData.get("completedTrekIds") as string) || "[]";

  const data = {
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    company: (formData.get("company") as string) || null,
    position: (formData.get("position") as string) || null,
    source: (formData.get("source") as string) || null,
    type: (formData.get("type") as string) || "lead",
    address: (formData.get("address") as string) || null,
    city: (formData.get("city") as string) || null,
    country: (formData.get("country") as string) || null,
    linkedInUrl: (formData.get("linkedInUrl") as string) || null,
    website: (formData.get("website") as string) || null,
    notes: (formData.get("notes") as string) || null,
    completedTrekIds,
  };

  if (userId) {
    // Upsert: update if a CrmContact already exists for this userId (e.g. auto-created from booking)
    await prisma.crmContact.upsert({
      where: { userId },
      create: { ...data, userId },
      update: { ...data },
    });
  } else {
    await prisma.crmContact.create({
      data,
    });
  }

  revalidatePath("/admin/crm");
  redirect("/admin/crm/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const userId = (formData.get("userId") as string) || null;
  const completedTrekIds = (formData.get("completedTrekIds") as string) || "[]";

  await prisma.crmContact.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      company: (formData.get("company") as string) || null,
      position: (formData.get("position") as string) || null,
      source: (formData.get("source") as string) || null,
      type: (formData.get("type") as string) || "lead",
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      country: (formData.get("country") as string) || null,
      linkedInUrl: (formData.get("linkedInUrl") as string) || null,
      website: (formData.get("website") as string) || null,
      notes: (formData.get("notes") as string) || null,
      userId,
    },
  });

  revalidatePath("/admin/crm");
  redirect("/admin/crm/contacts");
}

export async function deleteContact(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.crmContact.delete({ where: { id } });
  revalidatePath("/admin/crm");
  redirect("/admin/crm/contacts");
}

export async function addTagToContact(contactId: string, tagId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.crmContactTag.create({
    data: { contactId, tagId },
  });

  revalidatePath("/admin/crm");
}

export async function removeTagFromContact(contactId: string, tagId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.crmContactTag.delete({
    where: { contactId_tagId: { contactId, tagId } },
  });

  revalidatePath("/admin/crm");
}

export async function createTag(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.crmTag.create({
    data: {
      name: formData.get("name") as string,
      color: (formData.get("color") as string) || "#6366f1",
    },
  });

  revalidatePath("/admin/crm");
}

export async function deleteTag(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.crmTag.delete({ where: { id } });
  revalidatePath("/admin/crm");
}

export async function mergeContacts(primaryId: string, secondaryId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  // Move all customer history from the duplicate contact to the primary contact.
  await prisma.$transaction(async (tx) => {
    await tx.crmNote.updateMany({ where: { contactId: secondaryId }, data: { contactId: primaryId } });
    await tx.crmEmailLog.updateMany({ where: { contactId: secondaryId }, data: { contactId: primaryId } });
    await tx.traveller.updateMany({ where: { contactId: secondaryId }, data: { contactId: primaryId } });
    await tx.crmContact.delete({ where: { id: secondaryId } });
  });

  revalidatePath("/admin/crm");
}

// ==============================
// TRAVELLER ACTIONS
// ==============================

export async function createTraveller(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const contactId = (formData.get("contactId") as string) || null;
  const userId = (formData.get("userId") as string) || null;
  const completedTrekIds = (formData.get("completedTrekIds") as string) || "[]";

  await prisma.traveller.create({
    data: {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      nationality: (formData.get("nationality") as string) || null,
      passportNumber: (formData.get("passportNumber") as string) || null,
      notes: (formData.get("notes") as string) || null,
      completedTrekIds,
      contactId,
      userId,
      autoTracked: false,
    },
  });

  revalidatePath("/admin/crm");
  redirect("/admin/crm/travellers");
}

export async function updateTraveller(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const contactId = (formData.get("contactId") as string) || null;
  const userId = (formData.get("userId") as string) || null;
  const completedTrekIds = (formData.get("completedTrekIds") as string) || "[]";

  await prisma.traveller.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      nationality: (formData.get("nationality") as string) || null,
      passportNumber: (formData.get("passportNumber") as string) || null,
      notes: (formData.get("notes") as string) || null,
      completedTrekIds,
      contactId,
      userId,
    },
  });

  revalidatePath("/admin/crm");
  redirect("/admin/crm/travellers");
}

export async function deleteTraveller(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.traveller.delete({ where: { id } });
  revalidatePath("/admin/crm");
  redirect("/admin/crm/travellers");
}

// ==============================
// NOTE ACTIONS
// ==============================

export async function addNote(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.crmNote.create({
    data: {
      contactId: formData.get("contactId") as string,
      content: formData.get("content") as string,
      category: (formData.get("category") as string) || "general",
    },
  });

  revalidatePath("/admin/crm");
}

export async function deleteNote(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.crmNote.delete({ where: { id } });
  revalidatePath("/admin/crm");
}

// ==============================
// COMMUNICATION ACTIONS
// ==============================

export async function logEmail(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.crmEmailLog.create({
    data: {
      contactId: formData.get("contactId") as string,
      direction: formData.get("direction") as string || "sent",
      subject: formData.get("subject") as string,
      body: (formData.get("body") as string) || null,
      fromEmail: formData.get("fromEmail") as string,
      toEmail: formData.get("toEmail") as string,
      sentAt: new Date(),
    },
  });

  revalidatePath("/admin/crm");
}

// ==============================
// BOOKING COMPLETION HOOK
// ==============================

export async function autoLinkCompletedBooking(bookingId: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true },
  });

  if (!booking || booking.status !== "COMPLETED") return;

  // Find or create CRM contact for this user
  const contact = await prisma.crmContact.findFirst({
    where: { userId: booking.userId },
  });

  const existingTrekIds = contact?.completedTrekIds ? JSON.parse(contact.completedTrekIds) : [];

  if (!existingTrekIds.includes(booking.trekSlug)) {
    existingTrekIds.push(booking.trekSlug);
  }

  if (contact) {
    await prisma.crmContact.update({
      where: { id: contact.id },
      data: {
        completedTrekIds: JSON.stringify(existingTrekIds),
        autoTracked: true,
      },
    });
  } else {
    await prisma.crmContact.create({
      data: {
        name: booking.user.name || booking.user.email || "Unknown",
        email: booking.user.email,
        userId: booking.userId,
        completedTrekIds: JSON.stringify(existingTrekIds),
        autoTracked: true,
        type: "customer",
        source: "booking",
      },
    });
  }

  revalidatePath("/admin/crm");
}

// ==============================
// SETTINGS
// ==============================

export async function importContacts(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const data = JSON.parse(formData.get("data") as string || "[]");
  let imported = 0;
  let skipped = 0;

  for (const item of data) {
    if (!item.name) { skipped++; continue; }
    await prisma.crmContact.create({
      data: {
        name: item.name,
        email: item.email || null,
        phone: item.phone || null,
        company: item.company || null,
        source: "import",
        type: item.type || "lead",
      },
    });
    imported++;
  }

  revalidatePath("/admin/crm");
  return { imported, skipped, total: data.length };
}

export async function exportContacts() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const contacts = await prisma.crmContact.findMany({
    include: { tags: { include: { tag: true } } },
  });

  const csv = [
    "Name,Email,Phone,Company,Type,Source,Tags,Created",
    ...contacts.map((c) =>
      `"${c.name}","${c.email || ""}","${c.phone || ""}","${c.company || ""}","${c.type}","${c.source || ""}","${c.tags.map((t) => t.tag.name).join("; ")}","${c.createdAt.toISOString()}"`
    ),
  ].join("\n");

  return csv;
}
