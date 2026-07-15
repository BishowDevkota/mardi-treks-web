/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from "next";
import { AdminPage } from "@payloadcms/next/admin";
import type { PageParams } from "@payloadcms/next/admin";

import { importMap } from "../importMap";

type Args = {
  params: PageParams;
};

export const metadata: Metadata = {
  title: "Mardi Treks Admin",
};

const Admin = ({ params }: Args) => (
  <AdminPage
    adminRoute="admin"
    params={params}
    importMap={importMap}
  />
);

export default Admin;
