import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { sanitizeExcerptText } from "../src/lib/content-format";

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "WRITE"}`);

  // Cache author names so we don't refetch
  const authorCache = new Map<string, string | null>();
  async function getAuthorName(id?: string): Promise<string | null> {
    if (!id) return null;
    if (authorCache.has(id)) return authorCache.get(id) ?? null;
    try {
      const a = await db.collection("authors").doc(id).get();
      const name = a.exists ? ((a.data()?.name as string) || null) : null;
      authorCache.set(id, name);
      return name;
    } catch {
      authorCache.set(id, null);
      return null;
    }
  }

  const snap = await db.collection("articles").get();
  console.log(`Scanning ${snap.size} articles…`);

  let changed = 0;
  let unchanged = 0;
  let empty = 0;
  let batch = db.batch();
  let pendingInBatch = 0;
  const BATCH_LIMIT = 400;

  let i = 0;
  for (const doc of snap.docs) {
    i++;
    const data = doc.data();
    const before: string = (data.excerpt as string) || "";
    if (!before) {
      empty++;
      continue;
    }
    const authorName = await getAuthorName(data.authorId as string | undefined);
    const cleaned = sanitizeExcerptText(before, { authorName });

    if (cleaned === before) {
      unchanged++;
      continue;
    }

    changed++;
    if (changed <= 3) {
      console.log(`\n[sample ${changed}] ${data.slug || doc.id}`);
      console.log("  BEFORE:", before.slice(0, 140));
      console.log("  AFTER :", cleaned.slice(0, 140));
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, { excerpt: cleaned });
      pendingInBatch++;
      if (pendingInBatch >= BATCH_LIMIT) {
        await batch.commit();
        process.stdout.write(`  …committed ${pendingInBatch} updates (${i}/${snap.size})\n`);
        batch = db.batch();
        pendingInBatch = 0;
      }
    }
  }

  if (!DRY_RUN && pendingInBatch > 0) {
    await batch.commit();
    console.log(`  …committed final ${pendingInBatch} updates`);
  }

  console.log(`\nDone.`);
  console.log(`  changed:   ${changed}`);
  console.log(`  unchanged: ${unchanged}`);
  console.log(`  empty:     ${empty}`);
  console.log(`  total:     ${snap.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
