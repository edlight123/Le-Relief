import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { initializeFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let db: Firestore;

function formatPrivateKey(key: string): string {
  // Handle various formats Vercel might store the key as
  let formatted = key;
  // Remove surrounding quotes if present
  formatted = formatted.replace(/^["']|["']$/g, "");
  // Replace literal \n with actual newlines
  formatted = formatted.replace(/\\n/g, "\n");
  return formatted;
}

export function getApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (rawPrivateKey && clientEmail && projectId) {
        const privateKey = formatPrivateKey(rawPrivateKey);
        app = initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } else if (process.env.VERCEL) {
        throw new Error(
          "Firebase init failed — missing env vars. " +
          `PROJECT_ID=${!!projectId}, CLIENT_EMAIL=${!!clientEmail}, PRIVATE_KEY=${!!rawPrivateKey}`
        );
      } else {
        app = initializeApp({ projectId: projectId ?? undefined });
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
