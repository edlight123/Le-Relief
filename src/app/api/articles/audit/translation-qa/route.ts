import { NextRequest, NextResponse } from "next/server";
import {
  checkGlossaryConsistencyForEnTranslation,
  checkSourceLinkIntegrity,
} from "@/lib/translation-glossary";
import { getDb, serializeTimestamps } from "@/lib/firebase";

type ArticleDoc = Record<string, unknown> & {
  id: string;
  title?: string;
  body?: string;
  slug?: string;
  status?: string;
  language?: string;
  sourceArticleId?: string | null;
};

interface TranslationQaIssue {
  articleId: string;
  slug: string | null;
  title: string | null;
  status: string | null;
  sourceArticleId: string | null;
  warnings: Array<{
    scope: "source_reference" | "glossary" | "source_links";
    type: string;
    message: string;
    details?: Record<string, unknown>;
  }>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 200;
  }

  return Math.max(1, Math.min(1000, Math.floor(parsed)));
}

export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  const enSnap = await getDb().collection("articles").where("language", "==", "en").limit(limit).get();

  const enArticles = enSnap.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>),
  ) as ArticleDoc[];

  const sourceIds = [...new Set(enArticles.map((article) => article.sourceArticleId).filter(Boolean))] as string[];

  const sourceMap = new Map<string, ArticleDoc>();
  await Promise.all(
    sourceIds.map(async (sourceId) => {
      const sourceSnap = await getDb().collection("articles").doc(sourceId).get();
      if (!sourceSnap.exists) {
        return;
      }

      const source = serializeTimestamps({
        id: sourceSnap.id,
        ...sourceSnap.data(),
      } as Record<string, unknown>) as ArticleDoc;

      sourceMap.set(sourceSnap.id, source);
    }),
  );

  const issues: TranslationQaIssue[] = [];

  for (const article of enArticles) {
    const warnings: TranslationQaIssue["warnings"] = [];
    const sourceId = article.sourceArticleId || null;

    if (!sourceId) {
      warnings.push({
        scope: "source_reference",
        type: "missing_source_article",
        message: "EN article has no sourceArticleId.",
      });
    }

    const source = sourceId ? sourceMap.get(sourceId) : undefined;
    if (sourceId && !source) {
      warnings.push({
        scope: "source_reference",
        type: "source_not_found",
        message: `Linked FR source article does not exist (${sourceId}).`,
      });
    }

    if (source) {
      const glossaryWarnings = checkGlossaryConsistencyForEnTranslation({
        sourceText: `${asString(source.title)}\n${asString(source.body)}`,
        translatedText: `${asString(article.title)}\n${asString(article.body)}`,
      });

      for (const warning of glossaryWarnings) {
        warnings.push({
          scope: "glossary",
          type: warning.type,
          message: warning.message,
          details: {
            termId: warning.termId,
            fr: warning.fr,
            expectedEn: warning.expectedEn,
            found: warning.found ?? null,
          },
        });
      }

      const sourceLinkWarnings = checkSourceLinkIntegrity({
        sourceBody: asString(source.body),
        translatedBody: asString(article.body),
      });

      for (const warning of sourceLinkWarnings) {
        warnings.push({
          scope: "source_links",
          type: warning.type,
          message: warning.message,
          details: {
            url: warning.url,
          },
        });
      }
    }

    if (warnings.length > 0) {
      issues.push({
        articleId: article.id,
        slug: article.slug ?? null,
        title: article.title ?? null,
        status: article.status ?? null,
        sourceArticleId: sourceId,
        warnings,
      });
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary: {
      totalEnAudited: enArticles.length,
      issueCount: issues.length,
      warningCount: issues.reduce((sum, issue) => sum + issue.warnings.length, 0),
    },
    issues,
  });
}
