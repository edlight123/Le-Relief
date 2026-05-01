/**
 * Backfill: copy authorId + assignedTo from each FR article to its linked EN translations.
 * Run: npx tsx scripts/backfill-en-author-from-fr.ts
 */
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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
  console.log("Fetching all EN articles with a sourceArticleId…");
  const enSnap = await db.collection("articles")
    .where("language", "==", "en")
    .where("sourceArticleId", "!=", "")
    .get();

  console.log(`Found ${enSnap.size} EN articles to check.`);

  let updated = 0;
  let skipped = 0;

  for (const enDoc of enSnap.docs) {
    const en = enDoc.data();
    const sourceId = en["sourceArticleId"] as string | undefined;
    if (!sourceId) { skipped++; continue; }

    const frSnap = await db.collection("articles").doc(sourceId).get();
    if (!frSnap.exists) {
      console.log(`  ⚠  FR source ${sourceId} not found — skipping EN ${enDoc.id}`);
      skipped++;
      continue;
    }

    const fr = frSnap.data()!;
    const frAuthorId = fr["authorId"] as string | undefined;
    const frAssignedTo = fr["assignedTo"] as string | undefined;

    const enAuthorId = en["authorId"] as string | undefined;
    const enAssignedTo = en["assignedTo"] as string | undefined;

    const patch: Record<string, unknown> = {};
    if (frAuthorId && frAuthorId !== enAuthorId) patch["authorId"] = frAuthorId;
    if (frAssignedTo && frAssignedTo !== enAssignedTo) patch["assignedTo"] = frAssignedTo;

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    patch["updatedAt"] = FieldValue.serverTimestamp();
    await db.collection("articles").doc(enDoc.id).update(patch);
    const enSlug = en["slug"] ?? enDoc.id;
    const frSlug = fr["slug"] ?? sourceId;
    console.log(`  ✓  ${enSlug} ← authorId: ${frAuthorId}${frAssignedTo ? ` / assignedTo: ${frAssignedTo}` : ""}  (FR: ${frSlug})`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped/unchanged: ${skipped}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
