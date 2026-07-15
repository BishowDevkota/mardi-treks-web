import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: {
    group: "Content",
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === "admin",
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      required: true,
      defaultValue: "Mardi Treks",
    },
    {
      name: "tagline",
      type: "text",
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "favicon",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "navigation",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "link",
          type: "text",
          required: true,
        },
        {
          name: "isExternal",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
    {
      name: "footer",
      type: "group",
      fields: [
        {
          name: "description",
          type: "textarea",
        },
        {
          name: "email",
          type: "text",
        },
        {
          name: "phone",
          type: "text",
        },
        {
          name: "address",
          type: "text",
        },
        {
          name: "socialLinks",
          type: "array",
          fields: [
            {
              name: "platform",
              type: "text",
              required: true,
            },
            {
              name: "url",
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: "seo",
      type: "group",
      fields: [
        {
          name: "defaultMetaTitle",
          type: "text",
        },
        {
          name: "defaultMetaDescription",
          type: "textarea",
        },
        {
          name: "defaultOgImage",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
  ],
};
