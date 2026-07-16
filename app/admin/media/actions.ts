"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";

export async function deleteMedia(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") return;
  
  const media = await prisma.media.findUnique({ where: { id } });
  if (media?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(media.cloudinaryPublicId).catch(() => {});
  }
  
  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}

export async function uploadMedia(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  const alt = formData.get("alt") as string || "";
  const caption = formData.get("caption") as string || "";

  if (!file) throw new Error("No file provided");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const tmpDir = path.join(os.tmpdir(), "mardi-uploads");
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, file.name);
  await writeFile(tmpPath, buffer);

  try {
    const result = await cloudinary.uploader.upload(tmpPath, {
      folder: "mardi-treks/media",
      resource_type: "auto",
    });

    await prisma.media.create({
      data: {
        filename: file.name,
        mimeType: file.type,
        filesize: file.size,
        width: result.width,
        height: result.height,
        alt,
        caption,
        cloudinaryPublicId: result.public_id,
        url: result.secure_url,
      },
    });

    revalidatePath("/admin/media");
  } finally {
    // Clean up temp file
    try { await import("fs/promises").then((f) => f.unlink(tmpPath)); } catch {}
  }
}

export async function updateMediaAlt(id: string, alt: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") return;
  
  await prisma.media.update({ where: { id }, data: { alt } });
  revalidatePath("/admin/media");
}

