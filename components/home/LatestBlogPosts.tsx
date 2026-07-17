import Link from "next/link";
import { Calendar, Clock, ArrowRight, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { JsonLd, blogPostSchema } from "@/components/seo/JsonLd";

export async function LatestBlogPosts({
  heading,
  description,
}: {
  heading?: string | null;
  description?: string | null;
}) {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    orderBy: { publishedDate: "desc" },
    take: 3,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      author: true,
      publishedDate: true,
      heroImage: true,
      tags: true,
    },
  });

  if (posts.length === 0) {
    return null;
  }

  const postsWithMeta = posts.map((post) => {
    const wordCount = post.excerpt ? post.excerpt.split(/\s+/).length : 0;
    const readTimeMinutes = Math.max(1, Math.round(wordCount / 200));
    const dateStr = post.publishedDate.toISOString();
    return {
      ...post,
      date: dateStr.split("T")[0],
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
      {/* JSON-LD structured data for blog posts */}
      {postsWithMeta.map((post) => (
        <JsonLd
          key={post.slug}
          data={blogPostSchema({
            title: post.title,
            description: post.excerpt,
            author: post.author,
            datePublished: post.publishedDate.toISOString(),
            image: post.heroImage
              ? `https://res.cloudinary.com/dk7ggjvlw/image/upload/${post.heroImage}`
              : undefined,
          })}
        />
      ))}

      <section className="bg-background py-16 sm:py-24" aria-labelledby="latest-blog-posts-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center">
            <h2
              id="latest-blog-posts-heading"
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              {heading || "Latest from Our Blog"}
            </h2>
            <p className="mt-3 text-lg text-text-muted">
              {description || "Trekking tips, destination guides, and stories from the Himalayas"}
            </p>
          </div>

          {/* Blog card grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {postsWithMeta.map((post) => (
              <article
                key={post.slug}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(234,88,12,0.25)]"
                itemScope
                itemType="https://schema.org/BlogPosting"
              >
                {/* Hero image */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative aspect-[4/3] overflow-hidden"
                  tabIndex={-1}
                >
                  {post.heroImage ? (
                    <img
                      src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_600,q_auto,f_auto/${post.heroImage}`}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      itemProp="image"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface">
                      <FileText className="h-12 w-12 text-text-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-6">
                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-2">
                    {post.tags.slice(0, 2).map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors group-hover:bg-primary group-hover:text-white"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="rounded-full bg-surface-alt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={`/blog/${post.slug}`}>
                    <h3
                      className="mt-4 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary"
                      itemProp="headline"
                    >
                      {post.title}
                    </h3>
                  </Link>

                  {/* Excerpt */}
                  <p
                    className="mt-2 text-sm leading-relaxed text-text-muted line-clamp-3"
                    itemProp="description"
                  >
                    {post.excerpt}
                  </p>

                  {/* Author & Date */}
                  <div className="mt-auto flex items-center justify-between pt-6">
                    <time
                      dateTime={post.date}
                      className="text-xs text-text-muted"
                      itemProp="datePublished"
                    >
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </time>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
                      aria-label={`Read more about ${post.title}`}
                    >
                      Read More →
                    </Link>
                  </div>
                </div>

                {/* Hidden structured data for microdata */}
                <meta itemProp="publisher" content="Mardi Treks" />
                <meta itemProp="author" content={post.author} />
              </article>
            ))}
          </div>

          {/* View all CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-dark"
            >
              View All Articles
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
