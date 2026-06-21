import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  allowedDevOrigins: ['10.209.150.195'],
};

export default nextConfig;