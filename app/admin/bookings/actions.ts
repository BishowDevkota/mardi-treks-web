"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";

export async function updateBookingStatus(id: string, status: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.booking.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/bookings");
}

export async function deleteBooking(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  // Delete child records first to avoid foreign key constraint violations
  await prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { bookingId: id } });
    await tx.travelerDetail.deleteMany({ where: { bookingId: id } });
    await tx.booking.delete({ where: { id } });
  });

  invalidateCachePattern(cacheKeys.pattern.home);
  revalidatePath("/admin/bookings");
}

export async function getBookingStats() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const [total, pending, confirmed, completed, cancelled, totalRevenue] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
  ]);

  return { total, pending, confirmed, completed, cancelled, totalRevenue: totalRevenue._sum.totalPrice || 0 };
}
