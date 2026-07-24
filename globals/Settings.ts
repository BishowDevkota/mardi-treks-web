import type { GlobalConfig } from "payload";
import { invalidateSettingsCache } from "@/lib/payload-hooks";

export const Settings: GlobalConfig = {
  slug: "settings",
  hooks: {
    afterChange: [async () => { await invalidateSettingsCache(); }],
  },
  label: "Site Settings",
  admin: {
    group: "Content",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      defaultValue: "Mardi Treks",
      required: true,
    },
    {
      name: "tagline",
      type: "text",
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Site Logo",
    },
    {
      name: "description",
      type: "textarea",
      label: "Site Description",
    },
    {
      name: "email",
      type: "email",
      label: "Contact Email",
    },
    {
      name: "phone",
      type: "text",
      label: "Contact Phone",
    },
    {
      name: "address",
      type: "textarea",
      label: "Physical Address",
    },
    {
      name: "socialLinks",
      type: "json",
      label: "Social Media Links",
      admin: {
        description: 'JSON array: [{ "platform": "Facebook", "url": "https://..." }]',
      },
    },
    {
      name: "navigation",
      type: "json",
      label: "Navigation Menu",
      admin: {
        description: 'JSON array: [{ "label": "Treks", "href": "/treks" }]',
      },
    },
    // Default SEO
    {
      name: "defaultMetaTitle",
      type: "text",
      label: "Default Meta Title",
    },
    {
      name: "defaultMetaDescription",
      type: "textarea",
      label: "Default Meta Description",
      maxLength: 160,
    },
    {
      name: "defaultOgImage",
      type: "upload",
      relationTo: "media",
      label: "Default OG Image",
    },
  ],
};
