"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function approveReview(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  await prisma.trekReview.update({
    where: { id },
    data: { approved: true },
  });

  revalidatePath("/admin/reviews");
}

export async function rejectReview(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  // Reject = delete the review
  await prisma.trekReview.delete({ where: { id } });
  revalidatePath("/admin/reviews");
}
