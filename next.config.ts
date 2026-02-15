import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  webpack: (config) => {
    // Allow importing ONNX model files
    config.module.rules.push({
      test: /\.onnx$/,
      type: "asset/resource",
    });
    return config;
  },
  // Allow cross-origin resources for WASM/ONNX model loading
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
