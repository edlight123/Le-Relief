/**
 * Script: Strip <p></p> tags from all article bodies in Firestore.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/tmp/adc.json npx tsx scripts/strip-p-tags.ts
 */

import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "le-relief-haiti";

const app = getApps().length === 0
  ? initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID })
  : getApps()[0]!;

const db = getFirestore(app);

async function main() {
  console.log("Fetching all articles...");
  const snap = await db.collection("articles").get();
  console.log(`Found ${snap.size} articles\n`);

  let updated = 0;
  let skipped = 0;
  const batchSize = 400;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const body: string = doc.data().body || "";
    if (!body.includes("<p>") && !body.includes("</p>")) {
      skipped++;
      continue;
    }

    const cleaned = body
      .replace(/<\/?p[^>]*>/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    batch.update(doc.ref, { body: cleaned });
    batchCount++;
    updated++;

    if (batchCount >= batchSize) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount}`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${batchCount}`);
  }

  console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
