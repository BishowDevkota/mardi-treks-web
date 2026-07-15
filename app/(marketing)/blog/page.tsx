import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read our trekking guides, packing lists, permit information, and stories from the Himalayas. Expert advice for your Nepal adventure.",
};

// TODO: Fetch from Payload CMS
const posts = [
  {
    slug: "everest-base-camp-packing-list",
    title: "Ultimate Everest Base Camp Packing List",
    excerpt:
      "Everything you need to pack for your Everest Base Camp trek — from clothing layers to essential gear. Expert tips from guides who've done it 50+ times.",
    author: "Rajesh Gurung",
    date: "2026-06-15",
    readTime: "8 min read",
    tags: ["Packing Lists"],
  },
  {
    slug: "best-time-to-trek-nepal",
    title: "Best Time to Trek in Nepal: A Seasonal Guide",
    excerpt:
      "Spring vs autumn — which season is right for your trek? Detailed breakdown of weather, crowds, trail conditions, and mountain views for each season.",
    author: "Maya Sherpa",
    date: "2026-05-28",
    readTime: "10 min read",
    tags: ["Seasonal Guides"],
  },
  {
    slug: "nepal-trekking-permits-guide",
    title: "Nepal Trekking Permits: Complete Guide for 2026",
    excerpt:
      "All the permits you need for trekking in Nepal — TIMS, National Park entry fees, restricted area permits. Prices, where to get them, and pro tips.",
    author: "David Thapa",
    date: "2026-05-10",
    readTime: "6 min read",
    tags: ["Permit Guides"],
  },
  {
    slug: "altitude-sickness-prevention",
    title: "Altitude Sickness: Prevention and Recognition",
    excerpt:
      "How to prevent, recognize, and respond to altitude sickness on high-altitude treks. Expert medical advice for safe trekking above 3,000m.",
    author: "Dr. Anita Rai",
    date: "2026-04-22",
    readTime: "7 min read",
    tags: ["Travel Tips"],
  },
  {
    slug: "annapurna-circuit-vs-ebc",
    title: "Annapurna Circuit vs Everest Base Camp: Which Trek is Right for You?",
    excerpt:
      "Comparing Nepal's two most famous treks — difficulty, scenery, culture, cost, and logistics. Find your perfect adventure.",
    author: "Rajesh Gurung",
    date: "2026-04-08",
    readTime: "9 min read",
    tags: ["Trek Reviews"],
  },
  {
    slug: "sherpa-culture-and-traditions",
    title: "Sherpa Culture and Traditions on the Everest Trail",
    excerpt:
      "Discover the rich culture, Buddhist traditions, and warm hospitality of the Sherpa people as you trek through the Khumbu region.",
    author: "Maya Sherpa",
    date: "2026-03-18",
    readTime: "7 min read",
    tags: ["Culture & Heritage"],
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Blog</h1>
          <p className="mt-4 text-lg text-slate-300">
            Trekking guides, packing tips, permit information, and stories from the Himalayas.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {posts.map((post) => (
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
        </div>
      </section>
    </>
  );
}
