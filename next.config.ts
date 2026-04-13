import type { NextConfig } from "next";

// These packages must not be bundled — firebase-admin's gRPC/SSL stack
// breaks with "DECODER routines::unsupported" when bundled.
const FIREBASE_EXTERNALS = [
  "firebase-admin",
  "@google-cloud/firestore",
  "@grpc/grpc-js",
  "google-auth-library",
];

const nextConfig: NextConfig = {
  serverExternalPackages: FIREBASE_EXTERNALS,
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
          if (
            request &&
            FIREBASE_EXTERNALS.some(
              (pkg) => request === pkg || request.startsWith(pkg + "/"),
            )
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
