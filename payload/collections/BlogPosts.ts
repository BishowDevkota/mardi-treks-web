import type { CollectionConfig } from "payload";

export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "publishedDate", "status"],
    group: "Content",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === "admin",
    update: ({ req: { user } }) => user?.role === "admin",
    delete: ({ req: { user } }) => user?.role === "admin",
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
    },
    {
      name: "author",
      type: "text",
      required: true,
    },
    {
      name: "publishedDate",
      type: "date",
      required: true,
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      admin: {
        description: "Short summary for listing pages and meta descriptions",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "tags",
      type: "select",
      hasMany: true,
      options: [
        { label: "Packing Lists", value: "packing-lists" },
        { label: "Permit Guides", value: "permit-guides" },
        { label: "Seasonal Guides", value: "seasonal-guides" },
        { label: "Travel Tips", value: "travel-tips" },
        { label: "Trek Reviews", value: "trek-reviews" },
        { label: "Culture & Heritage", value: "culture-heritage" },
        { label: "Gear Reviews", value: "gear-reviews" },
        { label: "Stories", value: "stories" },
      ],
    },
    {
      name: "seo",
      type: "group",
      fields: [
        {
          name: "metaTitle",
          type: "text",
        },
        {
          name: "metaDescription",
          type: "textarea",
        },
        {
          name: "ogImage",
          type: "upload",
          relationTo: "media",
        },
      ],
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
  ],
};
