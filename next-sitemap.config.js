/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://marditreks.com",
  generateRobotsTxt: false, // We have a custom robots.ts
  generateIndexSitemap: false,
  outDir: "public",
  exclude: [
    "/admin",
    "/admin/*",
    "/dashboard",
    "/dashboard/*",
    "/api/*",
    "/_next/*",
    "/cms",
    "/cms/*",
  ],
  transform: async (config, path) => {
    // Default priority mapping
    let priority = 0.5;
    let changefreq = "monthly";

    if (path === "/") {
      priority = 1.0;
      changefreq = "weekly";
    } else if (path.startsWith("/treks") || path.startsWith("/tours") || path.startsWith("/climbing")) {
      priority = 0.9;
      changefreq = "weekly";
    } else if (path.match(/^\/[^\/]+\/[^\/]+$/)) {
      // Trek detail pages: /category/slug
      priority = 0.8;
      changefreq = "weekly";
    } else if (path.startsWith("/blog")) {
      priority = 0.7;
      changefreq = "monthly";
    } else if (["/about", "/contact"].includes(path)) {
      priority = 0.5;
      changefreq = "monthly";
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  additionalPaths: async (config) => {
    // The dynamic sitemap.ts handles most routes via ISR
    return [];
  },
};
