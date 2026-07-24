import type { CollectionConfig } from "payload";
import { invalidatePagesCache } from "@/lib/payload-hooks";

export const Pages: CollectionConfig = {
  slug: "pages",
  hooks: {
    afterChange: [async () => { await invalidatePagesCache(); }],
    afterDelete: [async () => { await invalidatePagesCache(); }],
  },
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "slug", "status"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "content",
      type: "richText",
      label: "Content",
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    // SEO
    {
      name: "metaTitle",
      type: "text",
      label: "Meta Title",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "metaDescription",
      type: "textarea",
      label: "Meta Description",
      maxLength: 160,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "ogImage",
      type: "upload",
      relationTo: "media",
      label: "OG Image",
      admin: {
        position: "sidebar",
      },
    },
  ],
};
