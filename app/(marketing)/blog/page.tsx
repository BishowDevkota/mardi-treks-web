import type { Metadata } from "next";
import { Mountain } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCachedOrFetch, cacheKeys, CACHE_TTL } from "@/lib/redis";
import { BlogCard } from "@/components/blog/BlogCard";
import { PageHero } from "@/components/layout/PageHero";
import { Pagination } from "@/components/ui/Pagination";

const POSTS_PER_PAGE = 9;

async function getPageContent() {
  return getCachedOrFetch(
    cacheKeys.pageContent,
    async () => {
      const settings = await prisma.siteSetting.findUnique({ where: { id: "site-settings" } });
      const raw = (settings as any)?.pageContent;
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    CACHE_TTL.PAGE_CONTENT
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const pc = await getPageContent();
  const blog = pc?.blog;
  const seo = blog?.seo;

  // Validate CMS content — reject placeholder/test titles
  const rawTitle = seo?.title || "";
  const isValidTitle = rawTitle &&
    rawTitle.length > 2 &&
    !["dsaf", "adsf", "asdf", "test", "hello", "hi"].some((p) => rawTitle.toLowerCase().includes(p));

  return {
    title: isValidTitle ? rawTitle : "Blog | Mardi Treks",
    description: seo?.description?.length > 5
      ? seo.description
      : "Read our trekking guides and stories from the Himalayas.",
    keywords: seo?.keywords || undefined,
    alternates: { canonical: "https://marditreks.com/blog" },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const pc = await getPageContent();
  const blog = pc?.blog || {};
  const hero = blog.hero || {};

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
        heroImage: true,
      },
    }),
    CACHE_TTL.MODERATE
  );

  const postsWithReadTime = posts.map((post) => {
    const wordCount = post.excerpt ? post.excerpt.split(/\s+/).length : 0;
    const readTimeMinutes = Math.max(1, Math.round(wordCount / 200));
    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      author: post.author,
      heroImage: post.heroImage,
      date: (() => {
        const d = post.publishedDate;
        if (!d) return "TBD";
        const dateStr = typeof d === "string" ? d : d.toISOString();
        return dateStr.split("T")[0];
      })(),
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
  const totalPages = Math.ceil(postsWithReadTime.length / POSTS_PER_PAGE);
  const paginatedPosts = postsWithReadTime.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  return (
    <>
      <PageHero
        heading={hero.heading || "Blog"}
        description={hero.description}
        backgroundImage={hero.backgroundImage}
        treks={allTreksForSearch}
        breadcrumbLabel="Blog"
      />

      {/* Posts */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          {paginatedPosts.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-alt">
                <Mountain className="h-8 w-8 text-text-muted" />
              </div>
              <p className="mt-5 text-lg font-semibold text-foreground">
                {currentPage > 1 ? "This page has no posts yet" : "No published posts yet"}
              </p>
              <p className="mt-1 text-sm text-text-muted">Check back soon for new articles!</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedPosts.map((post) => (
                  <BlogCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    heroImage={post.heroImage}
                    tags={post.tags}
                    date={post.date}
                    readTime={post.readTime}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/blog"
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
