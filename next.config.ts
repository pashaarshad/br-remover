import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configured for Next.js 15+/Turbopack compatibility
  // We are serving ONNX/WASM assets from public/imgly to avoid webpack loader issues
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
