import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp"],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploads.algorithmics.web.id",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
