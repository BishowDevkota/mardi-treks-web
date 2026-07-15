import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";
import path from "path";
import { fileURLToPath } from "url";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Treks } from "./collections/Treks";
import { BlogPosts } from "./collections/BlogPosts";
import { Pages } from "./collections/Pages";
import { SiteSettings } from "./collections/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " - Mardi Treks Admin",
      favicon: "/favicon.ico",
    },
  },
  collections: [Users, Media, Treks, BlogPosts, Pages],
  globals: [SiteSettings],
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  plugins: [
    seoPlugin({
      collections: ["treks", "blog-posts", "pages"],
      uploadsCollection: "media",
      generateTitle: ({ doc }: any) =>
        `${doc?.seo?.metaTitle || doc?.title || ""} | Mardi Treks`,
      generateDescription: ({ doc }: any) =>
        doc?.seo?.metaDescription || doc?.excerpt || "",
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
