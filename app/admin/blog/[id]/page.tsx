import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogForm } from "../blog-form";
import { ArrowLeft } from "lucide-react";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div>
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Edit Blog Post</h1>
      <p className="mt-1 text-sm text-slate-500">{post.title}</p>
      <BlogForm mode="edit" post={post} />
    </div>
  );
}
