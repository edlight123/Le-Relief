import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

import { getDb } from "@/lib/firebase";
import { translateFrenchArticleToEnglish } from "@/lib/ai/translation";
import { generateSlug } from "@/lib/slug";
import type { ArticleContentType } from "@/types/article";

export const runtime = "nodejs";
export const maxDuration = 60;

type ArticleRecord = Record<string, unknown>;
type FrPublishedArticle = {
  id: string;
  language?: string;
  title?: string;
  subtitle?: string | null;
  excerpt?: string | null;
  body?: string;
  slug?: string;
  categoryId?: string | null;
  authorId?: string | null;
  contentType?: ArticleContentType;
  coverImage?: string | null;
  coverImageCaption?: string | null;
  tags?: unknown;
};

const DEFAULT_BATCH = 3;
const MAX_BATCH = 10;

function clampBatch(value: string | null): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_BATCH;
  return Math.max(1, Math.min(MAX_BATCH, parsed));
}

async function uniqueSlug(db: Firestore, base: string): Promise<string> {
  let candidate = base || "article-en";
  let i = 1;

  while (true) {
    const existing = await db
      .collection("articles")
      .where("slug", "==", candidate)
      .limit(1)
      .get();

    if (existing.empty) return candidate;

    i += 1;
    candidate = `${base}-${i}`;

    if (i > 50) {
      return `${base}-${Date.now()}`;
    }
  }
}

async function getCategoryName(db: Firestore, categoryId: string | null | undefined) {
  if (!categoryId) return "General";
  const snap = await db.collection("categories").doc(categoryId).get();
  if (!snap.exists) return "General";
  const name = snap.data()?.name;
  return typeof name === "string" && name.trim() ? name : "General";
}

async function getAuthorName(db: Firestore, authorId: string | null | undefined) {
  if (!authorId) return "Le Relief";
  const snap = await db.collection("users").doc(authorId).get();
  if (!snap.exists) return "Le Relief";
  const data = snap.data() || {};
  const displayName = data.displayName;
  const name = data.name;
  const email = data.email;

  if (typeof displayName === "string" && displayName.trim()) return displayName;
  if (typeof name === "string" && name.trim()) return name;
  if (typeof email === "string" && email.trim()) return email;
  return "Le Relief";
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const cronAuth = req.headers.get("authorization") ?? "";
  if (cronAuth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchSize = clampBatch(req.nextUrl.searchParams.get("batch"));
  const db = getDb();

  const frPublishedSnap = await db
    .collection("articles")
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc")
    .limit(250)
    .get();

  const frArticles: FrPublishedArticle[] = frPublishedSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as ArticleRecord) }) as FrPublishedArticle)
    .filter((article) => (article.language as string | undefined) === "fr")
    .filter((article) => typeof article.body === "string" && article.body.trim().length > 0);

  const categoryCache = new Map<string, Promise<string>>();
  const authorCache = new Map<string, Promise<string>>();

  const getCachedCategoryName = (id: string | null | undefined) => {
    const key = id || "__none__";
    if (!categoryCache.has(key)) {
      categoryCache.set(key, getCategoryName(db, id));
    }
    return categoryCache.get(key)!;
  };

  const getCachedAuthorName = (id: string | null | undefined) => {
    const key = id || "__none__";
    if (!authorCache.has(key)) {
      authorCache.set(key, getAuthorName(db, id));
    }
    return authorCache.get(key)!;
  };

  let translated = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;
  let failed = 0;

  const details: Array<{ sourceArticleId: string; sourceSlug: string; result: string; info?: string }> = [];

  for (const article of frArticles) {
    if (translated >= batchSize) break;

    const sourceArticleId = String(article.id || "");
    const sourceSlug = String(article.slug || "");

    if (!sourceArticleId || !sourceSlug) {
      skippedInvalid++;
      details.push({ sourceArticleId, sourceSlug, result: "skipped_invalid" });
      continue;
    }

    const existingEn = await db
      .collection("articles")
      .where("sourceArticleId", "==", sourceArticleId)
      .limit(1)
      .get();

    if (!existingEn.empty) {
      skippedExisting++;
      details.push({ sourceArticleId, sourceSlug, result: "skipped_existing" });
      continue;
    }

    try {
      const categoryId = (article.categoryId as string | null | undefined) ?? null;
      const authorId = (article.authorId as string | null | undefined) ?? null;
      const contentType = (article.contentType as ArticleContentType | undefined) || "actualite";

      const [categoryName, authorName] = await Promise.all([
        getCachedCategoryName(categoryId),
        getCachedAuthorName(authorId),
      ]);

      const result = await translateFrenchArticleToEnglish({
        title: String(article.title || ""),
        subtitle: String(article.subtitle || ""),
        excerpt: String(article.excerpt || ""),
        body: String(article.body || ""),
        categoryName,
        contentType,
        authorName,
        sourceSlug,
      });

      const baseSlug = generateSlug(result.titleEn || `${sourceSlug}-en`);
      const slugEn = await uniqueSlug(db, baseSlug);
      const now = FieldValue.serverTimestamp();

      const createdRef = db.collection("articles").doc();
      await createdRef.set({
        title: result.titleEn,
        subtitle: result.subtitleEn || null,
        excerpt: result.excerptEn || null,
        body: result.bodyEn,
        slug: slugEn,
        seoTitle: result.seoTitleEn || null,
        metaDescription: result.seoDescriptionEn || null,
        summary: result.summaryEn || null,
        coverImage: article.coverImage || null,
        coverImageCaption: article.coverImageCaption || null,
        tags: Array.isArray(article.tags) ? article.tags : [],
        categoryId,
        authorId,
        contentType,
        status: "draft",
        featured: false,
        isBreaking: false,
        isHomepagePinned: false,
        priorityLevel: null,
        language: "en",
        isCanonicalSource: false,
        translationStatus: "generated_draft",
        sourceArticleId,
        alternateLanguageSlug: sourceSlug,
        allowTranslation: false,
        translationPriority: null,
        translationProvider: result.provider,
        translationModel: result.model,
        translationPromptVersion: result.promptVersion,
        translatedAt: now,
        publishedAt: null,
        scheduledAt: null,
        views: 0,
        createdAt: now,
        updatedAt: now,
      });

      await db.collection("articles").doc(sourceArticleId).update({
        alternateLanguageSlug: slugEn,
        updatedAt: now,
      });

      translated++;
      details.push({ sourceArticleId, sourceSlug, result: "translated", info: slugEn });
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      details.push({
        sourceArticleId,
        sourceSlug,
        result: "failed",
        info: message.slice(0, 300),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    batchSize,
    scanned: frArticles.length,
    translated,
    skippedExisting,
    skippedInvalid,
    failed,
    details,
  });
}
