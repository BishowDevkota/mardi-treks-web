import type { CollectionConfig } from "payload";
import { invalidateMediaCache } from "@/lib/payload-hooks";

export const Media: CollectionConfig = {
  slug: "media",
  hooks: {
    afterChange: [async () => { await invalidateMediaCache(); }],
    afterDelete: [async () => { await invalidateMediaCache(); }],
  },
  admin: {
    group: "Content",
  },
  access: {
    read: () => true,
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
        name: "card",
        width: 768,
        height: 576,
        position: "centre",
      },
      {
        name: "hero",
        width: 1920,
        height: 1080,
        position: "centre",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alt Text",
      admin: {
        description: "Descriptive alt text for accessibility and SEO",
      },
    },
    {
      name: "caption",
      type: "textarea",
      label: "Caption",
    },
  ],
};
