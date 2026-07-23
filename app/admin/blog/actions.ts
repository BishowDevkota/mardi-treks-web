"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { invalidateCachePattern, cacheKeys } from "@/lib/redis";
import { deleteFile } from "@/lib/cloudinary";

function invalidateBlogCache(slug?: string) {
  invalidateCachePattern(cacheKeys.pattern.blog);
  invalidateCachePattern(cacheKeys.pattern.home);
  revalidatePath("/", "layout");
  if (slug) {
    revalidatePath(`/blog/${slug}`, "page");
  }
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");
  await prisma.blogPost.create({
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      author: formData.get("author") as string,
      excerpt: formData.get("excerpt") as string || "",
      content: formData.get("content") as string || "",
      heroImage: formData.get("heroImage") as string || null,
      tags: formData.get("tags") as string || "[]",
      status: formData.get("status") as string || "draft",
      metaTitle: formData.get("metaTitle") as string || null,
      metaDescription: formData.get("metaDescription") as string || null,
      keywords: formData.get("keywords") as string || null,
      ogImage: formData.get("ogImage") as string || null,
      publishedDate: new Date(),
    },
  });
  invalidateBlogCache(formData.get("slug") as string || undefined);
  redirect("/admin/blog");
}

export async function updatePost(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  // Fetch current post to compare images
  const currentPost = await prisma.blogPost.findUnique({
    where: { id },
    select: { heroImage: true, ogImage: true },
  });

  const newHeroImage = formData.get("heroImage") as string || null;
  const newOgImage = formData.get("ogImage") as string || null;

  // Delete old heroImage if changed
  if (currentPost?.heroImage && currentPost.heroImage !== newHeroImage) {
    deleteFile(currentPost.heroImage).catch(() => {});
  }
  // Delete old ogImage if changed
  if (currentPost?.ogImage && currentPost.ogImage !== newOgImage) {
    deleteFile(currentPost.ogImage).catch(() => {});
  }

  await prisma.blogPost.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      author: formData.get("author") as string,
      excerpt: formData.get("excerpt") as string || "",
      content: formData.get("content") as string || "",
      heroImage: newHeroImage,
      tags: formData.get("tags") as string || "[]",
      status: formData.get("status") as string || "draft",
      metaTitle: formData.get("metaTitle") as string || null,
      metaDescription: formData.get("metaDescription") as string || null,
      keywords: formData.get("keywords") as string || null,
      ogImage: newOgImage,
    },
  });
  invalidateBlogCache(formData.get("slug") as string || undefined);
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { heroImage: true, ogImage: true },
  });

  // Delete Cloudinary images
  if (post) {
    const imagesToDelete = [post.heroImage, post.ogImage].filter(Boolean) as string[];
    await Promise.allSettled(imagesToDelete.map((pubId) => deleteFile(pubId)));
  }

  await prisma.blogPost.delete({ where: { id } });
  invalidateBlogCache();
  revalidatePath("/blog");
  revalidatePath("/", "layout");
  redirect("/admin/blog");
}
