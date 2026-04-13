import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin and its transitive deps must not be bundled — their
  // gRPC/SSL stack breaks with "DECODER routines::unsupported" when bundled.
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@grpc/grpc-js",
    "google-auth-library",
  ],
};

export default nextConfig;
