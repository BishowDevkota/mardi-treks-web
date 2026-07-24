import type { CollectionConfig } from "payload";
import { invalidateBlogCache } from "@/lib/payload-hooks";

export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
  hooks: {
    afterChange: [async () => { await invalidateBlogCache(); }],
    afterDelete: [async () => { await invalidateBlogCache(); }],
  },
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "author", "status", "publishedDate"],
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
      name: "author",
      type: "text",
      required: true,
      defaultValue: "Admin",
    },
    {
      name: "publishedDate",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "excerpt",
      type: "textarea",
      label: "Excerpt / Summary",
    },
    {
      name: "content",
      type: "richText",
      label: "Content",
    },
    {
      name: "tags",
      type: "json",
      label: "Tags",
      admin: {
        description: "JSON array of tags, e.g. [\"trekking\", \"tips\"]",
      },
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
