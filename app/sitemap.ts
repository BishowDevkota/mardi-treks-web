import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const baseUrl = "https://marditreks.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, treks, blogPosts] = await Promise.all([
    prisma.category.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.trek.findMany({
      where: { status: "published" },
      select: { slug: true, category: { select: { slug: true } }, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  // Static pages
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  // Category listing pages (e.g., /treks, /tour, /climbing)
  const categoryRoutes = categories.map((cat) => ({
    url: `${baseUrl}/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Product detail pages (e.g., /treks/everest-base-camp)
  const trekRoutes = treks.map((trek) => ({
    url: `${baseUrl}/${trek.category?.slug || "treks"}/${trek.slug}`,
    lastModified: trek.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Blog routes
  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...trekRoutes, ...blogRoutes];
}
