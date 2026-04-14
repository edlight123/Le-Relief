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
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
