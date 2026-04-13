import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { initializeFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let db: Firestore;

export function getApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey && clientEmail && projectId) {
        // Vercel stores multi-line values with literal \n
        privateKey = privateKey.replace(/\\n/g, "\n");
        privateKey = privateKey.replace(/^["']|["']$/g, "");
        app = initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } else if (process.env.VERCEL) {
        throw new Error(
          "Firebase init failed — missing env vars. " +
          `PROJECT_ID=${!!projectId}, CLIENT_EMAIL=${!!clientEmail}, PRIVATE_KEY=${!!privateKey}`
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
