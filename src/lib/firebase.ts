import {
  initializeApp,
  applicationDefault,
  getApps,
  type App,
} from "firebase-admin/app";
import { initializeFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage as getAdminStorage } from "firebase-admin/storage";
import { writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

type Bucket = ReturnType<ReturnType<typeof getAdminStorage>["bucket"]>;

let app: App;
let db: Firestore;

const SA_PATH = join(tmpdir(), "firebase-sa.json");

/**
 * Write a service-account JSON to a temp file and point
 * GOOGLE_APPLICATION_CREDENTIALS at it so the SDK uses ADC
 * instead of cert(). This avoids the crypto.createPrivateKey()
 * call that triggers "DECODER routines::unsupported" on Vercel.
 */
function ensureCredentials(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;
  if (existsSync(SA_PATH)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
    return;
  }

  // Option 1 — base64-encoded full service-account JSON (most reliable)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    writeFileSync(SA_PATH, Buffer.from(b64, "base64").toString("utf8"), {
      mode: 0o600,
    });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
    return;
  }

  // Option 2 — individual env vars → construct the JSON ourselves
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

  if (!privateKey || !clientEmail || !projectId) {
    if (process.env.VERCEL) {
      throw new Error(
        "Firebase init failed: credentials missing. " +
          `PROJECT_ID=${!!projectId} CLIENT_EMAIL=${!!clientEmail} PRIVATE_KEY=${!!privateKey}`,
      );
    }
    return; // local dev without full creds
  }

  // Normalise the key regardless of how Vercel stored it
  privateKey = privateKey.replace(/^["']|["']$/g, ""); // strip wrapping quotes
  privateKey = privateKey.replace(/\\n/g, "\n"); // literal \n → real newline

  const sa = {
    type: "service_account",
    project_id: projectId,
    private_key_id: "env",
    private_key: privateKey,
    client_email: clientEmail,
    client_id: "",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url:
      "https://www.googleapis.com/oauth2/v1/certs",
  };

  writeFileSync(SA_PATH, JSON.stringify(sa), { mode: 0o600 });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
}

export function getApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      ensureCredentials();

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        app = initializeApp({
          credential: applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID ?? undefined,
        });
      } else {
        // Local dev without credentials
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

/**
 * Returns the default Cloud Storage bucket. Requires either:
 *   - FIREBASE_STORAGE_BUCKET env var (e.g. "le-relief-haiti.firebasestorage.app"), or
 *   - the bucket on the resolved service-account project.
 *
 * Firebase projects created with the newer provisioning path use
 * `<project>.firebasestorage.app` as their default bucket (not
 * `<project>.appspot.com`). We default to that suffix first.
 */
let _bucket: Bucket | null = null;
export function getBucket(): Bucket {
  if (_bucket) return _bucket;
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^"+|"+$/g, "");
  const name =
    process.env.FIREBASE_STORAGE_BUCKET ||
    (projectId
      ? `${projectId}.firebasestorage.app`
      : undefined);
  _bucket = name
    ? getAdminStorage(getApp()).bucket(name)
    : getAdminStorage(getApp()).bucket();
  return _bucket;
}

/**
 * Convert Firestore Timestamp objects to ISO strings in a document.
 * Handles { _seconds, _nanoseconds } and { seconds, nanoseconds } shapes,
 * plus Firestore Timestamp instances with toDate().
 */
export function serializeTimestamps<T extends Record<string, unknown>>(
  doc: T,
): T {
  const result = { ...doc };
  for (const [key, value] of Object.entries(result)) {
    if (value && typeof value === "object") {
      const v = value as Record<string, unknown>;
      // Firestore Timestamp instance
      if (typeof (v as { toDate?: unknown }).toDate === "function") {
        (result as Record<string, unknown>)[key] = (
          v as { toDate: () => Date }
        )
          .toDate()
          .toISOString();
      }
      // Plain object with _seconds (REST mode)
      else if ("_seconds" in v && typeof v._seconds === "number") {
        (result as Record<string, unknown>)[key] = new Date(
          v._seconds * 1000,
        ).toISOString();
      }
      // Plain object with seconds
      else if ("seconds" in v && typeof v.seconds === "number") {
        (result as Record<string, unknown>)[key] = new Date(
          (v.seconds as number) * 1000,
        ).toISOString();
      }
    }
  }
  return result;
}
