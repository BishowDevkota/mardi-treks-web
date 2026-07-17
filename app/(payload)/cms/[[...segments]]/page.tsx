import type { Metadata } from "next";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";
import config from "../../../../payload.config";

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

const Page = ({ params, searchParams }: Args) => {
  return RootPage({
    config: config,
    importMap,
    params: params,
    searchParams: searchParams,
  });
};

export default Page;

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });
