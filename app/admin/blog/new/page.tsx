import { BlogForm } from "../blog-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewBlogPage() {
  return (
    <div>
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">New Blog Post</h1>
      <p className="mt-1 text-sm text-slate-500">Write a blog post with rich text formatting.</p>
      <BlogForm mode="create" />
    </div>
  );
}
