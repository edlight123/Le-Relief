/**
 * Backfill EN translations for FR articles whose body is empty/image-only.
 *
 * For these we only translate: title, subtitle, excerpt, seoTitle, metaDescription.
 * Body stays as-is (typically a 1-line image credit) — copied from FR.
 *
 * Handles three cases:
 *   A. FR has no EN at all  → create EN article, translate title-only fields, publish.
 *   B. FR has EN draft with empty title → translate title, publish.
 *   C. FR has EN draft with valid title but body too short → just publish.
 *
 * Cross-links alternateLanguageSlug on both sides.
 *
 * Usage:
 *   pnpm tsx scripts/translate-image-only-articles.ts            # dry run
 *   pnpm tsx scripts/translate-image-only-articles.ts --apply
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp, type WriteBatch } from "firebase-admin/firestore";

import { translateFrenchArticleToEnglish } from "../src/lib/ai/translation";
import { generateSlug } from "../src/lib/slug";

const APPLY = process.argv.includes("--apply");

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

interface FrArticle {
  id: string;
  data: Record<string, unknown>;
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const sanitized = (base || "article").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "article";
  let candidate = sanitized;
  let n = 1;
  while (true) {
    const snap = await db.collection("articles").where("slug", "==", candidate).limit(1).get();
    if (snap.empty) return candidate;
    n++;
    candidate = `${sanitized}-en${n === 2 ? "" : `-${n}`}`;
  }
}

async function translateTitleOnly(fr: Record<string, unknown>): Promise<{
  titleEn: string;
  excerptEn: string;
  subtitleEn: string;
  seoTitleEn: string;
  seoDescriptionEn: string;
}> {
  // Use the existing pipeline but feed a synthetic body so the model has context.
  // Fall back to title-only result fields.
  const title = ((fr.title as string) || "").trim();
  const subtitle = ((fr.subtitle as string) || "").trim();
  const excerpt = ((fr.excerpt as string) || "").trim();
  const fakeBody = [title, subtitle, excerpt].filter(Boolean).join("\n\n") || title;

  const result = await translateFrenchArticleToEnglish({
    title,
    subtitle: subtitle || null,
    excerpt: excerpt || null,
    body: fakeBody,
    categoryName: "",
    contentType: "actualite",
    authorName: "",
    sourceSlug: (fr.slug as string) || "",
  });

  return {
    titleEn: result.titleEn,
    excerptEn: result.excerptEn,
    subtitleEn: result.subtitleEn,
    seoTitleEn: result.seoTitleEn,
    seoDescriptionEn: result.seoDescriptionEn,
  };
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY RUN");

  const all = await db.collection("articles").get();
  const enBySource = new Map<string, { id: string; data: Record<string, unknown> }>();
  const frArticles: FrArticle[] = [];
  for (const doc of all.docs) {
    const data = doc.data() as Record<string, unknown>;
    const lang = (data.language as string) || "fr";
    if (lang === "en" && data.sourceArticleId) {
      enBySource.set(data.sourceArticleId as string, { id: doc.id, data });
    }
    if (lang === "fr" && data.status === "published") {
      frArticles.push({ id: doc.id, data });
    }
  }

  type Plan = {
    kind: "create" | "publish-existing" | "fill-title-and-publish";
    fr: FrArticle;
    en?: { id: string; data: Record<string, unknown> };
  };
  const plans: Plan[] = [];

  for (const fr of frArticles) {
    const body = ((fr.data.body as string) || "").trim();
    if (body.length >= 50) continue; // handled by main translator

    const en = enBySource.get(fr.id);
    if (!en) {
      plans.push({ kind: "create", fr });
    } else {
      const enTitle = ((en.data.title as string) || "").trim();
      const enStatus = en.data.status as string;
      if (enStatus === "published") continue; // already done somehow
      if (!enTitle) {
        plans.push({ kind: "fill-title-and-publish", fr, en });
      } else {
        plans.push({ kind: "publish-existing", fr, en });
      }
    }
  }

  console.log(`Plans:`);
  console.log(`  create new EN:                 ${plans.filter((p) => p.kind === "create").length}`);
  console.log(`  fill title then publish:       ${plans.filter((p) => p.kind === "fill-title-and-publish").length}`);
  console.log(`  publish existing (title ok):   ${plans.filter((p) => p.kind === "publish-existing").length}`);
  console.log(`  total:                         ${plans.length}`);

  if (!APPLY) {
    console.log("\nFR titles to handle:");
    for (const p of plans) console.log(`  [${p.kind}] ${(p.fr.data.title as string)?.slice(0, 90)}`);
    console.log("\nDry-run complete. Re-run with --apply.");
    return;
  }

  let processed = 0;
  for (const plan of plans) {
    const fr = plan.fr;
    const frSlug = (fr.data.slug as string) || "";
    const frPublishedAt = (fr.data.publishedAt as Timestamp | null) || null;

    try {
      if (plan.kind === "publish-existing") {
        // Just publish; cross-link both sides
        const enId = plan.en!.id;
        const enSlug = (plan.en!.data.slug as string) || "";
        const enBody = ((plan.en!.data.body as string) || "").trim();
        const updateBody = enBody.length === 0
          ? ((fr.data.body as string) || "")
          : undefined;

        const batch = db.batch();
        batch.update(db.collection("articles").doc(enId), {
          status: "published",
          translationStatus: "published",
          publishedAt: frPublishedAt ?? FieldValue.serverTimestamp(),
          alternateLanguageSlug: frSlug,
          updatedAt: FieldValue.serverTimestamp(),
          ...(updateBody !== undefined ? { body: updateBody } : {}),
        });
        batch.update(db.collection("articles").doc(fr.id), {
          alternateLanguageSlug: enSlug,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await batch.commit();
        console.log(`  ✓ publish-existing  ${enSlug}`);
      } else if (plan.kind === "fill-title-and-publish") {
        const t = await translateTitleOnly(fr.data);
        const titleEn = t.titleEn || (fr.data.title as string) || "Untitled";
        const enSlug = await ensureUniqueSlug(generateSlug(titleEn));
        // Update existing draft
        const enId = plan.en!.id;
        const oldSlug = (plan.en!.data.slug as string) || enSlug;
        const finalSlug = oldSlug || enSlug;
        const batch = db.batch();
        batch.update(db.collection("articles").doc(enId), {
          title: titleEn,
          subtitle: t.subtitleEn || "",
          excerpt: t.excerptEn || "",
          seoTitle: t.seoTitleEn || titleEn,
          metaDescription: t.seoDescriptionEn || t.excerptEn || "",
          status: "published",
          translationStatus: "published",
          publishedAt: frPublishedAt ?? FieldValue.serverTimestamp(),
          alternateLanguageSlug: frSlug,
          updatedAt: FieldValue.serverTimestamp(),
        });
        batch.update(db.collection("articles").doc(fr.id), {
          alternateLanguageSlug: finalSlug,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await batch.commit();
        console.log(`  ✓ fill-title        ${finalSlug}  ← "${titleEn.slice(0, 60)}"`);
      } else {
        // create new EN article
        const t = await translateTitleOnly(fr.data);
        const titleEn = t.titleEn || (fr.data.title as string) || "Untitled";
        const enSlug = await ensureUniqueSlug(generateSlug(titleEn));

        const newRef = db.collection("articles").doc();
        const batch = db.batch();
        batch.set(newRef, {
          title: titleEn,
          subtitle: t.subtitleEn || "",
          excerpt: t.excerptEn || "",
          body: (fr.data.body as string) || "",
          coverImage: fr.data.coverImage || null,
          coverImageCaption: fr.data.coverImageCaption || null,
          categoryId: fr.data.categoryId || null,
          authorId: fr.data.authorId || null,
          tags: Array.isArray(fr.data.tags) ? fr.data.tags : [],
          slug: enSlug,
          seoTitle: t.seoTitleEn || titleEn,
          metaDescription: t.seoDescriptionEn || t.excerptEn || "",
          language: "en",
          isCanonicalSource: false,
          sourceArticleId: fr.id,
          translationStatus: "published",
          contentType: fr.data.contentType || "actualite",
          status: "published",
          publishedAt: frPublishedAt ?? FieldValue.serverTimestamp(),
          alternateLanguageSlug: frSlug,
          allowTranslation: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          views: 0,
        });
        batch.update(db.collection("articles").doc(fr.id), {
          alternateLanguageSlug: enSlug,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await batch.commit();
        console.log(`  ✓ create            ${enSlug}  ← "${titleEn.slice(0, 60)}"`);
      }
      processed++;
    } catch (e) {
      console.error(`  ✗ ${frSlug}: ${(e as Error).message}`);
    }
  }

  console.log(`\nDONE — processed ${processed}/${plans.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
