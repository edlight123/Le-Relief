import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const SA_PATH = join(tmpdir(), "firebase-sa.json");
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  if (existsSync(SA_PATH)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
  } else {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (b64) {
      writeFileSync(SA_PATH, Buffer.from(b64, "base64").toString("utf8"), { mode: 0o600 });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
    }
  }
}
if (!getApps().length) initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  // The EN article id we found earlier
  const enId = "EonJ3KHM9P1TjzpnMi9X";
  const enDoc = await db.collection("articles").doc(enId).get();
  const en = enDoc.data()!;
  console.log("=== EN Article ===");
  console.log("id:", enId);
  console.log("slug:", en["slug"]);
  console.log("language:", en["language"]);
  console.log("status:", en["status"]);
  console.log("authorId:", en["authorId"]);
  console.log("sourceArticleId:", en["sourceArticleId"]);
  console.log("alternateLanguageSlug:", en["alternateLanguageSlug"]);

  // Now check the FR source
  const frId = en["sourceArticleId"] as string;
  if (frId) {
    const frDoc = await db.collection("articles").doc(frId).get();
    const fr = frDoc.data()!;
    console.log("\n=== FR Source Article ===");
    console.log("id:", frId);
    console.log("slug:", fr["slug"]);
    console.log("language:", fr["language"]);
    console.log("status:", fr["status"]);
    console.log("authorId:", fr["authorId"]);
    console.log("alternateLanguageSlug:", fr["alternateLanguageSlug"]);
  }
}

main().catch(console.error);
