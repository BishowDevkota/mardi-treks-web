import type { CollectionConfig } from "payload";
import { invalidateCategoryCache } from "@/lib/payload-hooks";

export const Categories: CollectionConfig = {
  slug: "categories",
  hooks: {
    afterChange: [async () => { await invalidateCategoryCache(); }],
    afterDelete: [async () => { await invalidateCategoryCache(); }],
  },
  admin: {
    useAsTitle: "name",
    group: "Content",
    defaultColumns: ["name", "slug", "status", "sort"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
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
      name: "description",
      type: "textarea",
    },
    {
      name: "icon",
      type: "text",
      admin: {
        description: "Emoji icon (e.g. 🏔️)",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "sort",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "published",
      options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    // SEO fields
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

  ],
};
