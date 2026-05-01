/**
 * Backfill alternateLanguageSlug on FR articles that are missing it,
 * by looking at the linked EN article's slug.
 */
import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY!).replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

async function main() {
  // Find all EN articles that have a sourceArticleId
  const enSnap = await db.collection("articles").where("language","==","en").where("sourceArticleId","!=","").get();
  console.log("EN articles with sourceArticleId:", enSnap.size);

  // Build a map: frId -> enSlug
  const updates = new Map<string, string>();
  for (const enDoc of enSnap.docs) {
    const en = enDoc.data();
    const frId = en.sourceArticleId as string;
    const enSlug = en.slug as string;
    if (frId && enSlug) updates.set(frId, enSlug);
  }
  console.log("Unique FR articles to check:", updates.size);

  // Batch-read FR docs in chunks of 50 using getAll
  const frIds = Array.from(updates.keys());
  const CHUNK = 50;
  const frDataMap = new Map<string, FirebaseFirestore.DocumentData>();
  for (let i = 0; i < frIds.length; i += CHUNK) {
    const chunk = frIds.slice(i, i + CHUNK);
    const refs = chunk.map((id) => db.collection("articles").doc(id));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (snap.exists) frDataMap.set(snap.id, snap.data()!);
    }
    process.stdout.write(`\rFetched ${Math.min(i + CHUNK, frIds.length)}/${frIds.length} FR docs...`);
  }
  console.log();

  // Write updates in batches of 500 (Firestore limit)
  let fixed = 0, skipped = 0;
  const WRITE_CHUNK = 499;
  const toUpdate: Array<{ id: string; enSlug: string }> = [];
  for (const [frId, enSlug] of updates) {
    const fr = frDataMap.get(frId);
    if (!fr) { skipped++; continue; }
    if (fr.alternateLanguageSlug === enSlug) { skipped++; continue; }
    toUpdate.push({ id: frId, enSlug });
  }
  console.log(`Need to update: ${toUpdate.length}, already correct: ${skipped}`);

  for (let i = 0; i < toUpdate.length; i += WRITE_CHUNK) {
    const chunk = toUpdate.slice(i, i + WRITE_CHUNK);
    const batch = db.batch();
    for (const { id, enSlug } of chunk) {
      batch.update(db.collection("articles").doc(id), {
        alternateLanguageSlug: enSlug,
        updatedAt: FieldValue.serverTimestamp(),
      });
      fixed++;
    }
    await batch.commit();
    console.log(`  Committed batch ${Math.floor(i / WRITE_CHUNK) + 1} (${fixed} total written)`);
  }
  console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}`);
}
main().catch(console.error);
