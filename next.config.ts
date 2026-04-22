import type { NextConfig } from "next";

// These packages must not be bundled — firebase-admin's gRPC/SSL stack
// breaks with "DECODER routines::unsupported" when bundled.
const FIREBASE_EXTERNALS = [
  "firebase-admin",
  "@google-cloud/firestore",
  "@grpc/grpc-js",
  "google-auth-library",
  "google-gax",
  "gtoken",
  "gaxios",
  "crypto",
];

const nextConfig: NextConfig = {
  serverExternalPackages: FIREBASE_EXTERNALS,
  poweredByHeader: false,
  turbopack: {},
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    deviceSizes: [320, 424, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
