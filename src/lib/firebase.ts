import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { initializeFirestore, type Firestore } from "firebase-admin/firestore";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let app: App;
let db: Firestore;

/**
 * Write the service account JSON to a temp file so firebase-admin loads
 * credentials via native Node.js crypto (not bundled/polyfilled crypto).
 * This avoids the "DECODER routines::unsupported" error on Vercel.
 */
function getServiceAccount(): string {
  const filePath = join(tmpdir(), "le-relief-firebase-sa.json");

  if (!existsSync(filePath)) {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (b64) {
      // Preferred: full service account JSON, base64-encoded
      writeFileSync(filePath, Buffer.from(b64, "base64").toString("utf8"));
    } else {
      // Fallback: construct from individual env vars
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
      privateKey = privateKey.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");

      const sa = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: privateKey,
      };
      writeFileSync(filePath, JSON.stringify(sa));
    }
  }

  return filePath;
}

export function getApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      const hasCredentials =
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
        (process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY);

      if (hasCredentials) {
        // Write creds to file, then load via require() so all PEM parsing
        // happens in Node.js native crypto, not bundled code.
        const credPath = getServiceAccount();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const serviceAccount = require(credPath);
        app = initializeApp({
          credential: cert(serviceAccount),
        });
      } else if (process.env.VERCEL) {
        throw new Error(
          "Firebase init failed — set FIREBASE_SERVICE_ACCOUNT_BASE64 in Vercel env vars."
        );
      } else {
        app = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID ?? undefined,
        });
      }
    } else {
      app = getApps()[0]!;
    }
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    db = initializeFirestore(getApp(), { preferRest: true });
  }
  return db;
}
