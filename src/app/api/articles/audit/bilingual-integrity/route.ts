import { NextResponse } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import { getDb, serializeTimestamps } from "@/lib/firebase";

export async function GET() {
  const timestamp = new Date().toISOString();

  const [enArticlesSnap, orphaned, invalidSources, frPublishedCanonical] = await Promise.all([
    getDb().collection("articles").where("language", "==", "en").get(),
    articlesRepo.getOrphanedEnArticles(),
    articlesRepo.getInvalidSourceReferences(),
    getDb()
      .collection("articles")
      .where("language", "==", "fr")
      .where("isCanonicalSource", "==", true)
      .where("status", "==", "published")
      .get(),
  ]);

  const enArticles = enArticlesSnap.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>),
  );

  const totalEnArticles = enArticles.length;

  const invalidNonOrphaned = invalidSources.filter(
    ({ article }) => Boolean(article.sourceArticleId),
  );

  const frSources = frPublishedCanonical.docs
    .map((doc) => serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>))
    .filter((doc) => doc.allowTranslation === true);

  const referencedSourceIds = new Set(
    enArticles
      .map((article) => article.sourceArticleId as string | null | undefined)
      .filter((value): value is string => Boolean(value)),
  );

  const unreferencedFrSources = frSources.filter(
    (frArticle) => !referencedSourceIds.has(frArticle.id as string),
  );

  const summary = {
    totalEnArticles,
    orphanedCount: orphaned.length,
    invalidSourceCount: invalidNonOrphaned.length,
    unreferencedSourcesCount: unreferencedFrSources.length,
    validCount: Math.max(totalEnArticles - orphaned.length - invalidNonOrphaned.length, 0),
  };

  return NextResponse.json({
    timestamp,
    summary,
    orphaned: orphaned.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      status: article.status,
      sourceArticleId: article.sourceArticleId ?? null,
      updatedAt: article.updatedAt ?? null,
    })),
    invalidSources: invalidNonOrphaned.map(({ article, error }) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      status: article.status,
      sourceArticleId: article.sourceArticleId,
      error,
    })),
    unreferencedFrSources: unreferencedFrSources.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      status: article.status,
      allowTranslation: article.allowTranslation,
      translationPriority: article.translationPriority ?? null,
    })),
  });
}
