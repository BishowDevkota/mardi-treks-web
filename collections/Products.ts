import type { CollectionConfig } from "payload";
import { invalidateTreksCache } from "@/lib/payload-hooks";

export const Products: CollectionConfig = {
  slug: "products",
  hooks: {
    afterChange: [async () => { await invalidateTreksCache(); }],
    afterDelete: [async () => { await invalidateTreksCache(); }],
  },
  labels: {
    singular: "Product",
    plural: "Products",
  },
  admin: {
    useAsTitle: "title",
    group: "Content",
    defaultColumns: ["title", "price", "duration", "difficulty", "status"],
  },
  access: {
    read: () => true,
  },
  fields: [
    // ── Basic Info ──────────────────────────────────────────────
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
      name: "category",
      type: "relationship",
      relationTo: "categories",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "price",
      label: "Base Price (USD)",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "Auto-calculated from pricing tiers lowest value",
        readOnly: true,
      },
    },
    {
      name: "duration",
      label: "Duration (Days)",
      type: "number",
      required: true,
      min: 1,
      admin: {
        description: "Auto-calculated from itinerary day count",
        readOnly: true,
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
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "region",
      type: "text",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "bestTime",
      label: "Best Time",
      type: "text",
      admin: {
        position: "sidebar",
        description: "e.g. Mar-May, Sep-Nov",
      },
    },
    {
      name: "maxAltitude",
      label: "Max Altitude (m)",
      type: "number",
      admin: {
        position: "sidebar",
        description: "Auto-calculated from itinerary elevation",
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

    // ── Hero Section ────────────────────────────────────────────
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      label: "Hero Image",
    },

    // ── Overview ────────────────────────────────────────────────
    {
      name: "overview",
      type: "richText",
      label: "Overview / Description",
    },

    // ── Day-by-day Itinerary ────────────────────────────────────
    {
      name: "itinerary",
      type: "array",
      label: "Day-by-Day Itinerary",
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
          type: "textarea",
          required: true,
        },
        {
          name: "elevation",
          type: "text",
          label: "Elevation (e.g. '5,364m')",
        },
        {
          name: "accommodation",
          type: "text",
        },
        {
          name: "placeDescription",
          type: "text",
          label: "Place Description",
          admin: {
            description: "A brief note about this location/place (e.g. 'Gateway to the Khumbu region')",
          },
        },
      ],
    },

    // ── Inclusions & Exclusions ─────────────────────────────────
    {
      name: "inclusions",
      type: "array",
      label: "What's Included",
      fields: [
        {
          name: "item",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "exclusions",
      type: "array",
      label: "What's Excluded",
      fields: [
        {
          name: "item",
          type: "text",
          required: true,
        },
      ],
    },

    // ── Pricing Tiers ───────────────────────────────────────────
    {
      name: "pricingTiers",
      type: "array",
      label: "Pricing Tiers",
      fields: [
        {
          name: "groupSize",
          type: "text",
          required: true,
          label: "Group Size (e.g. '1 person', '2-4 people')",
        },
        {
          name: "pricePerPerson",
          type: "number",
          required: true,
          min: 0,
          label: "Price Per Person (USD)",
        },
      ],
    },

    // ── Available Dates ─────────────────────────────────────────
    {
      name: "availableDates",
      type: "array",
      label: "Available Dates",
      fields: [
        {
          name: "startDate",
          type: "date",
          required: true,
          label: "Start Date",
        },
        {
          name: "seatsLeft",
          type: "number",
          defaultValue: 12,
          min: 0,
          label: "Seats Available",
        },
      ],
    },

    // ── Gallery ─────────────────────────────────────────────────
    {
      name: "gallery",
      type: "array",
      label: "Gallery Images",
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
          label: "Alt Text",
        },
      ],
    },

    // ── FAQs ────────────────────────────────────────────────────
    {
      name: "faqs",
      type: "array",
      label: "Frequently Asked Questions",
      fields: [
        {
          name: "question",
          type: "text",
          required: true,
        },
        {
          name: "answer",
          type: "textarea",
          required: true,
        },
      ],
    },

    // ── Reviews ─────────────────────────────────────────────────
    {
      name: "reviews",
      type: "array",
      label: "Guest Reviews",
      admin: {
        description: "Reviews are admin-moderated — only approved ones appear on the site.",
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
          label: "Approved (visible on site)",
        },
      ],
    },

    // ── Map ─────────────────────────────────────────────────────
    {
      name: "geoJsonUrl",
      type: "text",
      label: "GeoJSON URL",
      admin: {
        description: "URL to a hosted GeoJSON file for the trek route",
      },
    },
    {
      name: "geoJsonData",
      type: "json",
      label: "GeoJSON Data (raw)",
      admin: {
        description: "Paste raw GeoJSON route data here",
      },
    },
    {
      name: "staticMapImage",
      type: "upload",
      relationTo: "media",
      label: "Static Map Fallback Image",
      admin: {
        description: "A static image of the map route for SEO crawlers and social sharing",
      },
    },
    {
      name: "waypoints",
      type: "json",
      label: "Waypoints",
      admin: {
        description: "JSON array of { lng, lat, label, description? } waypoints",
      },
    },
    {
      name: "centerLat",
      type: "number",
      label: "Map Center Latitude",
    },
    {
      name: "centerLng",
      type: "number",
      label: "Map Center Longitude",
    },
    {
      name: "zoom",
      type: "number",
      label: "Map Zoom Level",
    },
    {
      name: "pitch",
      type: "number",
      label: "Map Pitch",
    },

    // ── Add-ons ────────────────────────────────────────────────
    {
      name: "addons",
      type: "json",
      label: "Add-ons (extra services)",
      admin: {
        description: 'JSON array: [{ "title": "Hotel", "description": "Extra night", "unit": "room", "pricePerUnit": 50 }]',
      },
    },

    // ── Custom Sections ─────────────────────────────────────────
    {
      name: "customSections",
      type: "json",
      label: "Custom Page Sections",
      admin: {
        description: "JSON array of custom sections for controlling page layout order",
      },
    },

    // ── SEO ─────────────────────────────────────────────────────
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
