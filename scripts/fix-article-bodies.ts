/**
 * Script: Fix article bodies that have:
 * 1. Orphaned </p> tags (no matching <p>)
 * 2. Leading bylines like "Par la rédaction" that duplicate the article header
 *
 * Usage:
 *   npx tsx scripts/fix-article-bodies.ts
 */

import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!
  .replace(/\\n/g, "\n")
  .replace(/^["']|["']$/g, "");

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}
const db = getFirestore();

/**
 * Returns true if the body has </p> or <p> tags that need cleaning.
 */
function needsCleaning(body: string): boolean {
  return /<\/?p[\s>]/i.test(body) || body.includes("</p>") || body.includes("<p>");
}

/**
 * Strips <p> and </p> tags, then removes a leading byline like:
 *   "Par la rédaction"
 *   "Par Jean Dupont"
 *   "By John Doe"
 * at the very start of the body (case-insensitive, optional whitespace).
 */
function cleanBody(body: string): string {
  // Strip all <p> and </p> tags
  let cleaned = body.replace(/<\/?p[^>]*>/gi, "");

  // Collapse excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Remove leading byline paragraph (e.g. "Par la rédaction" or "By Staff")
  // Matches optional leading whitespace, then "Par " or "By " followed by text up to a newline
  cleaned = cleaned.replace(/^\s*(Par|By)\s+[^\n]{1,80}\n*/i, "");

  return cleaned.trim();
}

async function main() {
  const slug = process.argv[2];
  let query: FirebaseFirestore.Query = db.collection("articles");
  if (slug) {
    query = query.where("slug", "==", slug) as FirebaseFirestore.Query;
  }

  console.log(slug ? `Checking article: ${slug}` : "Fetching all articles...");
  const snap = await query.get();
  console.log(`Found ${snap.size} articles\n`);

  let updated = 0;
  let skipped = 0;
  const batchSize = 400;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const body: string = data.body || "";

    const hasOrphanedTags = needsCleaning(body);
    const hasLeadingByline = /^\s*(Par|By)\s+/i.test(body.trim());

    if (!hasOrphanedTags && !hasLeadingByline) {
      skipped++;
      continue;
    }

    const cleaned = cleanBody(body);
    if (cleaned === body.trim()) {
      skipped++;
      continue;
    }

    if (slug) {
      // Preview mode for single article
      console.log("=== BEFORE (first 500 chars) ===");
      console.log(JSON.stringify(body.substring(0, 500)));
      console.log("\n=== AFTER (first 500 chars) ===");
      console.log(JSON.stringify(cleaned.substring(0, 500)));
      console.log("\nhasOrphanedTags:", hasOrphanedTags, "hasLeadingByline:", hasLeadingByline);
    }

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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
