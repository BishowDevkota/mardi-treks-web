import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Content",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === "admin",
    update: ({ req: { user } }) => user?.role === "admin",
    delete: ({ req: { user } }) => user?.role === "admin",
  },
  upload: {
    staticDir: "media",
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
        position: "centre",
      },
      {
        name: "small",
        width: 800,
        height: 600,
        position: "centre",
      },
      {
        name: "medium",
        width: 1200,
        height: 900,
        position: "centre",
      },
      {
        name: "large",
        width: 1920,
        height: 1080,
        position: "centre",
      },
      {
        name: "og",
        width: 1200,
        height: 630,
        position: "centre",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*", "application/json", "application/geo+json"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      admin: {
        description: "Alt text for accessibility and SEO",
      },
    },
    {
      name: "caption",
      type: "text",
    },
    {
      name: "cloudinaryPublicId",
      type: "text",
      admin: {
        description: "Cloudinary public ID if synced",
      },
    },
  ],
};
