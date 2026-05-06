import { NextRequest, NextResponse, after } from "next/server";
import * as articlesRepo from "@/lib/repositories/articles";
import { validatePublishReadiness } from "@/lib/editorial-quality";
import { logEditorialEvent } from "@/lib/repositories/editorial/audit";
import { broadcastArticlePublished } from "@/lib/push";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articles } = await articlesRepo.getArticles({ status: "scheduled" });
  const now = new Date();
  const toPublish = articles.filter(
    (a) => a.scheduledAt && new Date(a.scheduledAt as string) <= now,
  );

  const publishResults = await Promise.all(
    toPublish.map(async (a) => {
      const readiness = await validatePublishReadiness({
        articleId: String(a.id),
        title: String(a.title || ""),
        body: String(a.body || ""),
        excerpt: String(a.excerpt || ""),
        coverImage: String(a.coverImage || ""),
        categoryId: String(a.categoryId || ""),
        contentType: String(a.contentType || ""),
        slug: String(a.slug || ""),
        seoTitle: String(a.seoTitle || ""),
        metaDescription: String(a.metaDescription || ""),
      });

      if (!readiness.valid) {
        return { published: false, reason: readiness.errors.join(", "), id: String(a.id) };
      }

      await articlesRepo.updateArticle(a.id as string, {
        status: "published",
        publishedAt: new Date(a.scheduledAt as string),
      });
      await logEditorialEvent({
        articleId: String(a.id),
        actorId: "system-cron",
        type: "published",
        fromStatus: "scheduled",
        toStatus: "published",
        note: "Publication automatique CRON",
      });

      after(() =>
        broadcastArticlePublished({
          id: String(a.id),
          title: String(a.title || ""),
          slug: String(a.slug || ""),
          excerpt: String(a.excerpt || ""),
          language: String(a.language || "fr"),
          coverImage: String(a.coverImage || ""),
        }),
      );

      return { published: true, id: String(a.id) };
    }),
  );

  return NextResponse.json({
    published: publishResults.filter((result) => result.published).length,
    blocked: publishResults.filter((result) => !result.published),
    checked: articles.length,
  });
}
