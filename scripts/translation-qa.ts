import "dotenv/config";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { writeFileSync } from "node:fs";
import {
  checkGlossaryConsistencyForEnTranslation,
  checkSourceLinkIntegrity,
} from "../src/lib/translation-glossary";

type ArticleDoc = {
  id: string;
  title?: string;
  body?: string;
  slug?: string;
  status?: string;
  sourceArticleId?: string | null;
};

function parseLimitArg(): number {
  const arg = process.argv.find((value) => value.startsWith("--limit="));
  if (!arg) {
    return 200;
  }

  const parsed = Number(arg.split("=")[1]);
  if (!Number.isFinite(parsed)) {
    return 200;
  }

  return Math.max(1, Math.min(1000, Math.floor(parsed)));
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID ?? undefined,
  });
}

const db = getFirestore();

async function main() {
  const limit = parseLimitArg();
  const enSnap = await db.collection("articles").where("language", "==", "en").limit(limit).get();

  const enArticles: ArticleDoc[] = enSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ArticleDoc, "id">),
  }));

  const sourceIds = [...new Set(enArticles.map((article) => article.sourceArticleId).filter(Boolean))] as string[];

  const sources = new Map<string, ArticleDoc>();
  await Promise.all(
    sourceIds.map(async (sourceId) => {
      const sourceSnap = await db.collection("articles").doc(sourceId).get();
      if (!sourceSnap.exists) {
        return;
      }
      sources.set(sourceSnap.id, {
        id: sourceSnap.id,
        ...(sourceSnap.data() as Omit<ArticleDoc, "id">),
      });
    }),
  );

  const issues = enArticles
    .map((article) => {
      const sourceId = article.sourceArticleId || null;
      const warnings: Array<{
        scope: "source_reference" | "glossary" | "source_links";
        type: string;
        message: string;
      }> = [];

      if (!sourceId) {
        warnings.push({
          scope: "source_reference",
          type: "missing_source_article",
          message: "EN article has no sourceArticleId.",
        });
      }

      const source = sourceId ? sources.get(sourceId) : undefined;
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
          });
        }
      }

      if (warnings.length === 0) {
        return null;
      }

      return {
        articleId: article.id,
        slug: article.slug || null,
        title: article.title || null,
        status: article.status || null,
        sourceArticleId: sourceId,
        warnings,
      };
    })
    .filter((issue): issue is NonNullable<typeof issue> => issue !== null);

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      limit,
      totalEnAudited: enArticles.length,
      issueCount: issues.length,
      warningCount: issues.reduce((sum, issue) => sum + issue.warnings.length, 0),
    },
    issues,
  };

  const dateStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = `translation-qa-report-${dateStamp}.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);
}

main().catch((error) => {
  console.error("Translation QA failed", error);
  process.exit(1);
});
