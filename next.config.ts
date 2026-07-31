import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @tensorflow/tfjs-node ships native (.node) bindings — keep it out of
  // the bundler and load it directly from node_modules at runtime.
  serverExternalPackages: ["@tensorflow/tfjs-node"],
};

export default nextConfig;
