"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
      ogImage: formData.get("ogImage") as string || null,
      publishedDate: new Date(),
    },
  });
  revalidatePath("/blog", "layout");
  redirect("/admin/blog");
}

export async function updatePost(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");
  await prisma.blogPost.update({
    where: { id },
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
      ogImage: formData.get("ogImage") as string || null,
    },
  });
  revalidatePath("/blog", "layout");
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") throw new Error("Unauthorized");
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/blog");
  redirect("/admin/blog");
}
