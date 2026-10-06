import type { NextConfig } from "next";
import path from "node:path";

const ortBundle = path.resolve("node_modules/onnxruntime-web/dist/ort.bundle.min.mjs");

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws"],
  turbopack: {
    resolveAlias: {
      fs: "./lib/empty-module.ts",
      path: "./lib/empty-module.ts",
      crypto: "./lib/empty-module.ts",
      "ort.bundle.min.mjs": "./node_modules/onnxruntime-web/dist/ort.bundle.min.mjs",
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      path: false,
      crypto: false,
    };
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "ort.bundle.min.mjs": ortBundle,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/ocr/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
