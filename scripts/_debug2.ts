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
  const frSlug = "les-emirats-arabes-unis-annoncent-leur-retrait-surprise-de-lopep-a-partir-du-1er-mai-2026";

  // Find the FR article
  const frSnap = await db.collection("articles").where("slug", "==", frSlug).limit(2).get();
  console.log("FR articles found:", frSnap.size);
  for (const d of frSnap.docs) {
    const data = d.data();
    console.log("\nFR id:", d.id);
    console.log("  language:", data["language"]);
    console.log("  status:", data["status"]);
    console.log("  alternateLanguageSlug:", data["alternateLanguageSlug"] ?? "NOT SET");
    console.log("  authorId:", data["authorId"]);

    // Find linked EN article
    const enSnap = await db.collection("articles").where("sourceArticleId", "==", d.id).limit(5).get();
    console.log("  Linked EN articles:", enSnap.size);
    for (const en of enSnap.docs) {
      const enData = en.data();
      console.log("    EN id:", en.id, "slug:", enData["slug"], "status:", enData["status"], "alternateLanguageSlug:", enData["alternateLanguageSlug"] ?? "NOT SET");
    }
  }
}

main().catch(console.error);
