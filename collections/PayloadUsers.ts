import type { CollectionConfig } from "payload";

export const PayloadUsers: CollectionConfig = {
  slug: "payload-users",
  auth: true,
  admin: {
    useAsTitle: "email",
    group: "Administration",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [{ name: "name", type: "text" }],
};
