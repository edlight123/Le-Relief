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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      // Unconditionally externalize firebase-admin family regardless of
      // which file is importing them, matching EdLight-News approach.
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : [];

      config.externals = [
        ...existingExternals,
        function (
          { request }: { request?: string },
          callback: (err: null, result?: string) => void,
        ) {
          if (!request) return callback(null);

          // Externalize firebase-admin and its transitive deps
          if (
            FIREBASE_EXTERNALS.some(
              (pkg) => request === pkg || request.startsWith(pkg + "/"),
            )
          ) {
            return callback(null, `commonjs ${request}`);
          }

          // Ensure Node.js builtins used by firebase-admin are never polyfilled
          if (
            request === "crypto" ||
            request === "node:crypto" ||
            request === "tls" ||
            request === "node:tls" ||
            request === "net" ||
            request === "node:net"
          ) {
            return callback(null, `commonjs ${request}`);
          }

          callback(null);
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
