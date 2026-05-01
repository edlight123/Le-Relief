/**
 * One-time backfill: copy coverImageFirebaseUrl from FR source articles
 * to their EN translations that are missing it.
 *
 * Run with:
 *   npx tsx scripts/backfill-en-cover-image-firebase-url.ts
 */

import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const SA_PATH = join(tmpdir(), "firebase-sa.json");
function ensureCredentials(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;
  if (existsSync(SA_PATH)) { process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH; return; }
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) { writeFileSync(SA_PATH, Buffer.from(b64, "base64").toString("utf8"), { mode: 0o600 }); process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH; }
}
ensureCredentials();

const _app = getApps().length === 0
  ? initializeApp({ credential: applicationDefault(), projectId: "le-relief-haiti" })
  : getApps()[0]!;


const db = getFirestore();

async function main() {
  console.log("Fetching EN translated articles missing coverImageFirebaseUrl…");

  // Get all EN articles that are translations (have sourceArticleId) but no coverImageFirebaseUrl
  const enSnap = await db
    .collection("articles")
    .where("language", "==", "en")
    .get();

  const toFix = enSnap.docs.filter((doc) => {
    const data = doc.data();
    return (
      data.sourceArticleId &&
      !data.coverImageFirebaseUrl &&
      (data.coverImage || true) // include even if coverImage is blank — we'll get the Firebase URL from FR
    );
  });

  console.log(`Found ${toFix.length} EN articles to potentially fix.`);

  let fixed = 0;
  let skipped = 0;
  let notFound = 0;

  for (const doc of toFix) {
    const data = doc.data();
    const sourceId = data.sourceArticleId as string;

    const frDoc = await db.collection("articles").doc(sourceId).get();
    if (!frDoc.exists) {
      notFound++;
      continue;
    }

    const frData = frDoc.data()!;
    const firebaseUrl = frData.coverImageFirebaseUrl as string | null | undefined;

    if (!firebaseUrl) {
      skipped++;
      continue;
    }

    await doc.ref.update({ coverImageFirebaseUrl: firebaseUrl });
    console.log(`  ✓ Fixed EN article "${data.slug}" ← ${firebaseUrl.slice(0, 60)}…`);
    fixed++;
  }

  console.log(`\nDone. Fixed: ${fixed}, Skipped (FR also missing): ${skipped}, FR not found: ${notFound}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
