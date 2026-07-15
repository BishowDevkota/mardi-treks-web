import type { CollectionConfig } from "payload";

export const Treks: CollectionConfig = {
  slug: "treks",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "region", "difficulty", "price", "duration", "updatedAt"],
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
      localized: true,
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
      name: "price",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "Price per person in USD",
      },
    },
    {
      name: "duration",
      type: "number",
      required: true,
      min: 1,
      admin: {
        description: "Number of days",
      },
    },
    {
      name: "difficulty",
      type: "select",
      required: true,
      options: [
        { label: "Easy", value: "easy" },
        { label: "Moderate", value: "moderate" },
        { label: "Challenging", value: "challenging" },
        { label: "Difficult", value: "difficult" },
        { label: "Extreme", value: "extreme" },
      ],
    },
    {
      name: "region",
      type: "select",
      required: true,
      options: [
        { label: "Annapurna", value: "annapurna" },
        { label: "Everest", value: "everest" },
        { label: "Langtang", value: "langtang" },
        { label: "Mustang", value: "mustang" },
        { label: "Manaslu", value: "manaslu" },
        { label: "Kanchenjunga", value: "kanchenjunga" },
        { label: "Far West", value: "far-west" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "maxGroupSize",
      type: "number",
      required: true,
      min: 1,
      max: 50,
      defaultValue: 12,
    },
    {
      name: "hero",
      type: "group",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "subtitle",
          type: "text",
          required: true,
        },
        {
          name: "badge",
          type: "text",
        },
      ],
    },
    {
      name: "highlights",
      type: "array",
      labels: {
        singular: "Highlight",
        plural: "Highlights",
      },
      fields: [
        {
          name: "icon",
          type: "text",
          required: true,
          admin: {
            description: "Emoji or icon identifier",
          },
        },
        {
          name: "text",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "overview",
      type: "richText",
      required: true,
    },
    {
      name: "itinerary",
      type: "array",
      labels: {
        singular: "Day",
        plural: "Itinerary Days",
      },
      fields: [
        {
          name: "dayNumber",
          type: "number",
          required: true,
        },
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "richText",
          required: true,
        },
        {
          name: "elevation",
          type: "text",
          admin: {
            description: "e.g. '2,800m → 3,500m'",
          },
        },
        {
          name: "accommodation",
          type: "text",
          admin: {
            description: "e.g. 'Teahouse', 'Camping'",
          },
        },
      ],
    },
    {
      name: "mapRoute",
      type: "group",
      fields: [
        {
          name: "geoJson",
          type: "upload",
          relationTo: "media",
          admin: {
            description: "Upload GeoJSON route file",
          },
        },
        {
          name: "staticMapImage",
          type: "upload",
          relationTo: "media",
          admin: {
            description: "Fallback image for SEO and non-JS contexts",
          },
        },
        {
          name: "waypoints",
          type: "json",
          admin: {
            description: "Optional array of {lng, lat, label} waypoints",
          },
        },
      ],
    },
    {
      name: "inclusions",
      type: "array",
      labels: {
        singular: "Inclusion",
        plural: "Inclusions",
      },
      fields: [
        {
          name: "text",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "exclusions",
      type: "array",
      labels: {
        singular: "Exclusion",
        plural: "Exclusions",
      },
      fields: [
        {
          name: "text",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "pricingTiers",
      type: "array",
      labels: {
        singular: "Pricing Tier",
        plural: "Pricing Tiers",
      },
      fields: [
        {
          name: "groupSize",
          type: "text",
          required: true,
          admin: {
            description: "e.g. '1 person', '2-4 people'",
          },
        },
        {
          name: "pricePerPerson",
          type: "number",
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: "availableDates",
      type: "array",
      labels: {
        singular: "Available Date",
        plural: "Available Dates",
      },
      fields: [
        {
          name: "startDate",
          type: "date",
          required: true,
        },
        {
          name: "seatsLeft",
          type: "number",
          required: true,
          defaultValue: 12,
          min: 0,
        },
      ],
    },
    {
      name: "gallery",
      type: "array",
      labels: {
        singular: "Gallery Image",
        plural: "Gallery Images",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "alt",
          type: "text",
        },
      ],
    },
    {
      name: "faqs",
      type: "array",
      labels: {
        singular: "FAQ",
        plural: "FAQs",
      },
      fields: [
        {
          name: "question",
          type: "text",
          required: true,
        },
        {
          name: "answer",
          type: "richText",
          required: true,
        },
      ],
    },
    {
      name: "reviews",
      type: "array",
      labels: {
        singular: "Review",
        plural: "Reviews",
      },
      fields: [
        {
          name: "author",
          type: "text",
          required: true,
        },
        {
          name: "rating",
          type: "number",
          required: true,
          min: 1,
          max: 5,
        },
        {
          name: "text",
          type: "textarea",
          required: true,
        },
        {
          name: "approved",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description: "Only approved reviews are shown publicly",
          },
        },
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
        {
          name: "canonicalUrl",
          type: "text",
        },
      ],
    },
    {
      name: "relatedTreks",
      type: "relationship",
      relationTo: "treks",
      hasMany: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      admin: {
        position: "sidebar",
      },
    },
  ],
};
