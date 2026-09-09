import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  reactCompiler: true,
};

export default nextConfig;
