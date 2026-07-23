import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft, ArrowRight, Mountain } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis";
import { SearchBar } from "@/components/search/SearchBar";
import { injectHeadingIds } from "@/lib/headings";
import BlogSidebar from "@/components/blog/BlogSidebar";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedOrFetch(
    cacheKeys.blogPostMeta(slug),
    () => prisma.blogPost.findUnique({
      where: { slug },
      select: { title: true, excerpt: true, metaTitle: true, metaDescription: true, keywords: true },
    }),
    300
  );
  if (!post) return {};

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords || undefined,
    alternates: { canonical: `https://marditreks.com/blog/${slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getCachedOrFetch(
    cacheKeys.blogPost(slug),
    () => prisma.blogPost.findUnique({
      where: { slug, status: "published" },
    }),
    300
  );

  if (!post) notFound();

  // Fetch treks for the search bar
  const allTreksForSearch = await getCachedOrFetch(
    cacheKeys.searchTreks,
    () => prisma.trek.findMany({
      where: { status: "published" },
      select: { title: true, slug: true, region: true, difficulty: true, duration: true, category: { select: { slug: true } } },
      orderBy: { title: "asc" },
    }),
    300
  );

  const readTime = Math.max(1, Math.round((post.content?.split(/\s+/).length || 0) / 200));
  const tags: string[] = (() => {
    try {
      const parsed = JSON.parse(post.tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const formattedDate = new Date(post.publishedDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const heroImageUrl = post.heroImage
    ? `https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_1200,q_auto,f_auto/${post.heroImage}`
    : null;

  const overlayStyle = {
    background: `
      linear-gradient(180deg, rgba(15,12,8,0.02) 0%, rgba(12,10,7,0.15) 25%, rgba(12,10,7,0.55) 55%, rgba(12,10,7,0.88) 100%),
      linear-gradient(90deg, rgba(12,10,7,0.45) 0%, rgba(12,10,7,0) 55%)
    `,
  };

  return (
    <>
      {/* ── Hero (matching PageHero design) ── */}
      <section className="relative isolate flex min-h-[clamp(520px,82vh,860px)] flex-col overflow-hidden">
        {/* Background image or gradient fallback */}
        {heroImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageUrl})`, transform: "scale(1.02)" }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-dark via-primary-dark/20 to-gray-900" />
        )}

        {/* Decorative circles (only when no image) */}
        {!heroImageUrl && (
          <>
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          </>
        )}

        {/* Dual overlay (matches PageHero exactly) — always on top */}
        <div className="absolute inset-0 z-[1]" style={overlayStyle} />

        {/* Content — bottom-aligned, same wrapper as page content */}
        <div className="relative z-10 mt-auto w-full">
          <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-6 pb-[clamp(48px,7vw,84px)]">
            <div className="max-w-[720px]">
          {/* Tags — transparent frosted style */}
          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/50">
            <Link href="/" className="transition-colors hover:text-white/80">Home</Link>
            <span className="text-white/30">/</span>
            <Link href="/blog" className="transition-colors hover:text-white/80">Blog</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/80 truncate max-w-[200px] sm:max-w-[400px]">{post.title}</span>
          </nav>

          {/* Title — same size as PageHero */}
          <h1 className="mb-6 text-[clamp(32px,5vw,58px)] font-bold leading-[1.08] tracking-tight text-white">
            {post.title}
          </h1>

          {/* Search bar — after title */}
          <div className="mb-8 w-full max-w-xl">
            <SearchBar treks={allTreksForSearch} />
          </div>

          {/* Meta — author, date, read time */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/80 backdrop-blur-sm">
                {post.author?.charAt(0)?.toUpperCase() || "?"}
              </span>
              {post.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readTime} min read
            </span>
          </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Article with sidebar (matching product page layout) ── */}
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-8 pb-24">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* ── MAIN CONTENT ── */}
          <div className="flex flex-col space-y-0 lg:col-span-2">
            {/* Content */}
            <article>
              <div
                className="prose-custom rich-text"
                dangerouslySetInnerHTML={{ __html: injectHeadingIds(post.content || "") }}
              />
            </article>

            {/* Footer */}
            <div className="mt-16 border-t border-border pt-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {post.author?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{post.author}</p>
                    <p className="text-xs text-text-muted">Published on {formattedDate}</p>
                  </div>
                </div>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
                >
                  <ArrowLeft className="h-4 w-4" />
                  More Articles
                </Link>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ──
              NOTE: no "hidden" here anymore. BlogSidebar renders on every
              breakpoint and internally decides what to show:
              - below lg: a fixed hamburger button + slide-in panel
              - lg and up: the docked sidebar panel
              Wrapping it in "hidden lg:block" previously unmounted the
              whole component (hamburger included) on mobile. */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              <BlogSidebar />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}