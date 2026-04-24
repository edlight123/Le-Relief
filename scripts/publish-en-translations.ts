/**
 * Publish all generated_draft EN translations.
 *
 * - status: draft → published
 * - translationStatus: generated_draft → published
 * - publishedAt: copy from FR source publishedAt (so chronology stays correct)
 *                fall back to now() if missing
 * - alternateLanguageSlug:
 *     EN article ← FR slug
 *     FR article ← EN slug   (so hreflang works on both sides)
 *
 * Skips:
 *   - EN with empty/short body (< 50 chars)
 *   - EN with empty title
 *   - FR source not found
 *   - FR source not currently published
 *
 * Usage:
 *   pnpm tsx scripts/publish-en-translations.ts                # dry-run by default
 *   pnpm tsx scripts/publish-en-translations.ts --apply        # actually write
 *   pnpm tsx scripts/publish-en-translations.ts --apply --limit=10
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, type WriteBatch } from "firebase-admin/firestore";

function flag(name: string): string | undefined {
  const arg = process.argv.find((v) => v === `--${name}` || v.startsWith(`--${name}=`));
  if (!arg) return undefined;
  if (!arg.includes("=")) return "true";
  return arg.split("=").slice(1).join("=");
}

const APPLY = flag("apply") === "true";
const LIMIT = Number(flag("limit") ?? Number.POSITIVE_INFINITY);

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

interface ArticleLite {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: string;
  translationStatus: string;
  language: string;
  sourceArticleId: string | null;
  publishedAt: FirebaseFirestore.Timestamp | null;
  alternateLanguageSlug: string | null;
}

function toLite(id: string, d: Record<string, unknown>): ArticleLite {
  return {
    id,
    slug: (d.slug as string) || "",
    title: ((d.title as string) || "").trim(),
    body: ((d.body as string) || "").trim(),
    status: (d.status as string) || "",
    translationStatus: (d.translationStatus as string) || "",
    language: (d.language as string) || "fr",
    sourceArticleId: (d.sourceArticleId as string) || null,
    publishedAt: (d.publishedAt as FirebaseFirestore.Timestamp) || null,
    alternateLanguageSlug: (d.alternateLanguageSlug as string) || null,
  };
}

async function main() {
  console.log(APPLY ? "MODE: APPLY (writes will be committed)" : "MODE: DRY RUN (no writes)");

  const all = await db.collection("articles").get();
  const byId = new Map<string, ArticleLite>();
  for (const doc of all.docs) {
    byId.set(doc.id, toLite(doc.id, doc.data()));
  }

  const enDrafts = [...byId.values()].filter(
    (a) => a.language === "en" && a.status === "draft" && a.translationStatus === "generated_draft",
  );

  console.log(`EN generated drafts found: ${enDrafts.length}`);

  type Action = {
    enId: string;
    enSlug: string;
    frId: string;
    frSlug: string;
    publishedAt: FirebaseFirestore.Timestamp | null;
    needsFrAlternateUpdate: boolean;
    needsEnAlternateUpdate: boolean;
  };

  const actions: Action[] = [];
  const skipped: Array<{ slug: string; reason: string }> = [];

  for (const en of enDrafts) {
    if (actions.length >= LIMIT) break;
    if (!en.title) {
      skipped.push({ slug: en.slug, reason: "empty title" });
      continue;
    }
    if (en.body.length < 50) {
      skipped.push({ slug: en.slug, reason: `body too short (${en.body.length} chars)` });
      continue;
    }
    if (!en.sourceArticleId) {
      skipped.push({ slug: en.slug, reason: "no sourceArticleId" });
      continue;
    }
    const fr = byId.get(en.sourceArticleId);
    if (!fr) {
      skipped.push({ slug: en.slug, reason: "FR source missing" });
      continue;
    }
    if (fr.language !== "fr") {
      skipped.push({ slug: en.slug, reason: `FR source has lang=${fr.language}` });
      continue;
    }
    if (fr.status !== "published") {
      skipped.push({ slug: en.slug, reason: `FR source status=${fr.status}` });
      continue;
    }

    actions.push({
      enId: en.id,
      enSlug: en.slug,
      frId: fr.id,
      frSlug: fr.slug,
      publishedAt: fr.publishedAt,
      needsEnAlternateUpdate: en.alternateLanguageSlug !== fr.slug,
      needsFrAlternateUpdate: fr.alternateLanguageSlug !== en.slug,
    });
  }

  console.log(`Eligible to publish: ${actions.length}`);
  console.log(`Skipped:             ${skipped.length}`);
  if (skipped.length) {
    console.log("\nFirst 15 skipped:");
    for (const s of skipped.slice(0, 15)) console.log(`  - [${s.reason}] ${s.slug}`);
  }

  const enAltUpdates = actions.filter((a) => a.needsEnAlternateUpdate).length;
  const frAltUpdates = actions.filter((a) => a.needsFrAlternateUpdate).length;
  console.log(`\nWill update alternateLanguageSlug on: ${enAltUpdates} EN, ${frAltUpdates} FR`);

  if (!APPLY) {
    console.log("\nDry-run complete. Re-run with --apply to commit.");
    return;
  }

  // Commit in batches of 250 (each EN article = 1 write + 1 FR write = up to 500 ops)
  const BATCH_SIZE = 200;
  let committed = 0;
  for (let i = 0; i < actions.length; i += BATCH_SIZE) {
    const slice = actions.slice(i, i + BATCH_SIZE);
    const batch: WriteBatch = db.batch();
    for (const a of slice) {
      const enRef = db.collection("articles").doc(a.enId);
      batch.update(enRef, {
        status: "published",
        translationStatus: "published",
        publishedAt: a.publishedAt ?? FieldValue.serverTimestamp(),
        alternateLanguageSlug: a.frSlug,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (a.needsFrAlternateUpdate) {
        const frRef = db.collection("articles").doc(a.frId);
        batch.update(frRef, {
          alternateLanguageSlug: a.enSlug,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    await batch.commit();
    committed += slice.length;
    console.log(`  committed ${committed}/${actions.length}`);
  }

  console.log("\n=== DONE ===");
  console.log(JSON.stringify({ published: committed, skipped: skipped.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
