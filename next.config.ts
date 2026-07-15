import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.mapbox.com",
        pathname: "/**",
      },
    ],
  },
  // Turbopack is the default in Next.js 16
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default withPayload(nextConfig);
