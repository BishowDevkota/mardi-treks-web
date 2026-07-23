import Link from "next/link";
import { Calendar, Clock, ArrowRight, FileText } from "lucide-react";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  heroImage: string | null;
  tags: string[];
  date: string;
  readTime: string;
}

export function BlogCard({ slug, title, excerpt, heroImage, tags, date, readTime }: BlogCardProps) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(234,88,12,0.25)]"
    >
      {/* Hero image */}
      <Link
        href={`/blog/${slug}`}
        className="relative aspect-[4/3] overflow-hidden"
        tabIndex={-1}
      >
        {heroImage ? (
          <img
            src={`https://res.cloudinary.com/dk7ggjvlw/image/upload/c_fill,w_600,q_auto,f_auto/${heroImage}`}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
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
          {tags.slice(0, 2).map((tag) => (
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
              {readTime}
            </span>
          </span>
        </div>

        {/* Title */}
        <Link href={`/blog/${slug}`}>
          <h3 className="mt-4 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="mt-2 text-sm leading-relaxed text-text-muted line-clamp-3">
          {excerpt}
        </p>

        {/* Date & Read More */}
        <div className="mt-auto flex items-center justify-between pt-6">
          <time dateTime={date} className="text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </time>
          <Link
            href={`/blog/${slug}`}
            className="text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
            aria-label={`Read more about ${title}`}
          >
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
}
