import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft, User } from "lucide-react";

// TODO: Fetch from Payload CMS
const blogPosts: Record<string, any> = {
  "everest-base-camp-packing-list": {
    title: "Ultimate Everest Base Camp Packing List",
    content: `
      <p>Packing for Everest Base Camp can feel overwhelming. With temperatures ranging from 15°C in the sunny valleys to -15°C at Gorak Shep, and everything in between, you need a system — not just a list.</p>
      <p>After guiding over 50 EBC treks, here's exactly what I pack and recommend to every trekker.</p>
      <h2>The Layering System</h2>
      <p>The key to high-altitude trekking comfort is layers. You'll be hot while climbing, cold while resting, and freezing at sunrise.</p>
      <ul>
        <li><strong>Base layer</strong>: Merino wool or synthetic long-sleeve (2-3 pairs)</li>
        <li><strong>Mid layer</strong>: Fleece jacket or lightweight puffy</li>
        <li><strong>Outer shell</strong>: Waterproof and windproof jacket</li>
        <li><strong>Trekking pants</strong>: Convertible zip-off pants (2 pairs)</li>
        <li><strong>Insulated pants</strong>: For cold mornings and evenings</li>
      </ul>
      <h2>Footwear</h2>
      <p>Your boots are your most important piece of gear. Don't skimp here.</p>
      <ul>
        <li>Waterproof trekking boots (broken in!)</li>
        <li>Camp shoes / sandals for evenings</li>
        <li>5-6 pairs of merino wool trekking socks</li>
        <li>Gaiters (optional but recommended in spring)</li>
      </ul>
      <h2>Essential Gear</h2>
      <ul>
        <li>Sleeping bag rated to -15°C (or rent in Kathmandu)</li>
        <li>Trekking poles — save your knees on the descents</li>
        <li>Headlamp with extra batteries</li>
        <li>Water bottles (2x 1L) + hydration tablets</li>
        <li>UV-protection sunglasses (category 4)</li>
        <li>Sunscreen SPF 50+ and lip balm with SPF</li>
      </ul>
    `,
    author: "Rajesh Gurung",
    date: "2026-06-15",
    readTime: "8 min read",
    tags: ["Packing Lists"],
    excerpt: "Everything you need to pack for your Everest Base Camp trek.",
  },
};

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) notFound();

  return (
    <>
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
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
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {post.title}
          </h1>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
