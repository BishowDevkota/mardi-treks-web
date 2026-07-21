import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, FileText, Mountain } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis";

export const revalidate = 300;

async function getPageContent() {
  return getCachedOrFetch(
    cacheKeys.pageContent,
    async () => {
      const settings = await prisma.siteSetting.findUnique({ where: { id: "site-settings" } });
      const raw = (settings as any)?.pageContent;
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    300
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const pc = await getPageContent();
  const blog = pc?.blog;
  return {
    title: blog?.seo?.title || "Blog",
    description: blog?.seo?.description || "Read our trekking guides and stories from the Himalayas.",
    alternates: { canonical: "https://marditreks.com/blog" },
  };
}

export default async function BlogPage() {
  const pc = await getPageContent();
  const blog = pc?.blog || {};
  const hero = blog.hero || {};

  const posts = await getCachedOrFetch(
    cacheKeys.blogPosts,
    () => prisma.blogPost.findMany({
      where: { status: "published" },
      orderBy: { publishedDate: "desc" },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        author: true,
        publishedDate: true,
        tags: true,
      },
    }),
    300
  );

  const postsWithReadTime = posts.map((post) => {
    const wordCount = post.excerpt ? post.excerpt.split(/\s+/).length : 0;
    const readTimeMinutes = Math.max(1, Math.round(wordCount / 200));
    return {
      ...post,
      date: post.publishedDate.toISOString().split("T")[0],
      readTime: `${readTimeMinutes} min read`,
      tags: (() => {
        try {
          const parsed = JSON.parse(post.tags);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
    };
  });
  return (
    <>
      {/* Hero */}
      <section
        className="relative flex items-center py-16"
        style={hero.backgroundImage ? {
          backgroundImage: `url(https://res.cloudinary.com/dk7ggjvlw/image/upload/${hero.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}}
      >
        {hero.backgroundImage && <div className="absolute inset-0 bg-black/50" />}
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Mountain className="mx-auto h-12 w-12 text-primary-light" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {hero.heading || "Blog"}
          </h1>
          {hero.description && (
            <p className="mt-4 text-lg text-slate-300">{hero.description}</p>
          )}
        </div>
      </section>

      {/* Posts */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {postsWithReadTime.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <FileText className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No published posts yet</p>
              <p className="mt-1 text-xs text-slate-400">Check back soon for new articles!</p>
            </div>
          ) : (
          <div className="space-y-8">
            {postsWithReadTime.map((post) => (
              <article
                key={post.slug}
                className="group rounded-xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="mt-3 text-xl font-bold text-foreground group-hover:text-primary">
                    {post.title}
                  </h2>
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-text">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-text-muted">By {post.author}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    Read More
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          )}
        </div>
      </section>
    </>
  );
}
