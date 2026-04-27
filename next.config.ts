import type { NextConfig } from "next";

// These packages must not be bundled — firebase-admin's gRPC/SSL stack
// breaks with "DECODER routines::unsupported" when bundled.
const FIREBASE_EXTERNALS = [
  "firebase-admin",
  "@google-cloud/firestore",
  "@google-cloud/storage",
  "@grpc/grpc-js",
  "google-auth-library",
  "google-gax",
  "gtoken",
  "gaxios",
  "crypto",
  // Renderer (Playwright + sharp + native libvips) must never be bundled.
  "@le-relief/renderer",
  "@le-relief/types",
  "playwright-core",
  "sharp",
];

const nextConfig: NextConfig = {
  serverExternalPackages: FIREBASE_EXTERNALS,
  poweredByHeader: false,
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Force webpack to leave native/server-only deps as runtime requires.
      const externals = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean);
      config.externals = [
        ...externals,
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (!request) return callback();
          if (
            request === "playwright-core" ||
            request.startsWith("playwright-core/") ||
            request === "sharp" ||
            request === "@le-relief/renderer" ||
            request.startsWith("@le-relief/renderer/")
          ) {
            return callback(null, "commonjs " + request);
          }
          callback();
        },
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    deviceSizes: [320, 424, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
  },
  async redirects() {
    return [
      // Writer: workspace
      { source: "/dashboard", destination: "/admin/workspace", permanent: true },
      // Writer: new article
      { source: "/dashboard/articles/new", destination: "/admin/articles/new", permanent: true },
      // Writer: drafts
      { source: "/dashboard/my-drafts", destination: "/admin/drafts", permanent: true },
      // Writer: revisions
      { source: "/dashboard/revisions", destination: "/admin/revisions", permanent: true },
      // Editor: review
      { source: "/dashboard/review", destination: "/admin/review", permanent: true },
      // Publisher: approved → ready
      { source: "/dashboard/approved", destination: "/admin/publishing/ready", permanent: true },
      // Publisher: scheduled
      { source: "/dashboard/scheduled", destination: "/admin/publishing/scheduled", permanent: true },
      // Publisher: published
      { source: "/dashboard/published", destination: "/admin/publishing/published", permanent: true },
      // Publisher: homepage
      { source: "/dashboard/homepage", destination: "/admin/homepage", permanent: true },
      // Publisher: media
      { source: "/dashboard/media", destination: "/admin/media", permanent: true },
      // Admin: articles
      { source: "/dashboard/articles", destination: "/admin/articles", permanent: true },
      // Admin: categories → sections
      { source: "/dashboard/categories", destination: "/admin/sections", permanent: true },
      // Admin: users
      { source: "/dashboard/users", destination: "/admin/users", permanent: true },
      // Admin: authors
      { source: "/dashboard/authors", destination: "/admin/authors", permanent: true },
      // Admin: settings
      { source: "/dashboard/settings", destination: "/admin/settings", permanent: true },
    ];
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
