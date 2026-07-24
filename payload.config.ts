import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import { Products } from "./collections/Products";
import { Categories } from "./collections/Categories";
import { BlogPosts } from "./collections/BlogPosts";
import { Pages } from "./collections/Pages";
import { Media } from "./collections/Media";
import { PayloadUsers } from "./collections/PayloadUsers";
import { Settings } from "./globals/Settings";

export default buildConfig({
  // Server URL for admin panel and API
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",

  // Secret for authentication (required by Payload)
  secret: process.env.PAYLOAD_SECRET || "dev-payload-secret-change-in-production",

  // Admin configuration
  admin: {
    user: "payload-users",
    meta: {
      titleSuffix: " | Mardi Treks CMS",
    },
  },

  // Database adapter — shared PostgreSQL with Prisma
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),

  // Rich text editor
  editor: lexicalEditor(),

  // Collections
  collections: [PayloadUsers, Products, Categories, BlogPosts, Pages, Media],

  // Globals
  globals: [Settings],

  // Plugins (none yet)
  graphQL: {
    disable: true,
  },
});
