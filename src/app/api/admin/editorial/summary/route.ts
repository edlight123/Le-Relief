import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, serializeTimestamps } from "@/lib/firebase";

export const dynamic = "force-dynamic";

async function requireAdminOrEditor() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "admin" && role !== "publisher")) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdminOrEditor();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const articlesRef = db.collection("articles");

    // Fetch all articles (aggregate)
    const allSnap = await articlesRef.get();
    const allDocs = allSnap.docs.map((d) =>
      serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
    );

    const totalArticles = allDocs.length;
    const frArticles = allDocs.filter((a) => a.language === "fr");
    const enArticles = allDocs.filter((a) => a.language === "en");
    const publishedFr = frArticles.filter((a) => a.status === "published").length;
    const publishedEn = enArticles.filter((a) => a.status === "published").length;

    // By status
    const byStatus = {
      draft: allDocs.filter((a) => a.status === "draft").length,
      pending_review: allDocs.filter((a) => a.status === "pending_review" || a.status === "in_review").length,
      published: allDocs.filter((a) => a.status === "published").length,
    };

    // By content type
    const contentTypes: Record<string, number> = {};
    for (const a of allDocs) {
      const ct = (a.contentType as string) || "actualite";
      contentTypes[ct] = (contentTypes[ct] || 0) + 1;
    }

    // By category
    const byCategory: Record<string, number> = {};
    for (const a of allDocs) {
      const cat = (a.categoryId as string) || "uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    // Translation status
    const translationQueue = {
      pending_review: enArticles.filter((a) => a.translationStatus === "pending_review" || a.translationStatus === "in_review").length,
      generated_draft: enArticles.filter((a) => a.translationStatus === "generated_draft").length,
      approved: enArticles.filter((a) => a.translationStatus === "approved").length,
    };
    const translationSuccessRate: number =
      enArticles.length > 0
        ? Math.round((translationQueue.approved / enArticles.length) * 100)
        : 0;

    // Translation backlog: FR articles with allowTranslation=true but no EN
    const frAllowTranslation = frArticles.filter((a) => a.allowTranslation === true && a.status === "published");
    const enSourceIds = new Set(enArticles.map((a) => a.sourceArticleId as string).filter(Boolean));
    const translationBacklog = frAllowTranslation
      .filter((a) => !enSourceIds.has(a.id as string))
      .map((a) => ({
        id: a.id,
        title: a.title,
        translationPriority: a.translationPriority,
        publishedAt: a.publishedAt,
      }));

    // Publishing velocity: articles published per week (last 12 weeks)
    const now = new Date();
    const weeklyVelocity: { week: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = allDocs.filter((a) => {
        const pub = a.publishedAt ? new Date(a.publishedAt as string) : null;
        return pub && pub >= weekStart && pub < weekEnd && a.status === "published";
      }).length;
      const label = `S${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      weeklyVelocity.push({ week: label, count });
    }

    // Author performance
    const authorStats: Record<string, { count: number; views: number }> = {};
    for (const a of allDocs) {
      const authorId = (a.authorId as string) || "unknown";
      if (!authorStats[authorId]) authorStats[authorId] = { count: 0, views: 0 };
      authorStats[authorId].count++;
      authorStats[authorId].views += (a.views as number) || 0;
    }

    // Featured article
    const featuredSnap = await articlesRef
      .where("status", "==", "published")
      .where("featured", "==", true)
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get();
    const featuredArticle = featuredSnap.empty
      ? null
      : serializeTimestamps({ id: featuredSnap.docs[0]!.id, ...featuredSnap.docs[0]!.data() } as Record<string, unknown>);

    return NextResponse.json({
      totalArticles,
      frArticles: frArticles.length,
      enArticles: enArticles.length,
      publishedFr,
      publishedEn,
      enPercentage: frArticles.length > 0 ? Math.round((publishedEn / Math.max(publishedFr, 1)) * 100) : 0,
      byStatus,
      contentTypes,
      byCategory,
      translationQueue,
      translationSuccessRate,
      translationBacklog: translationBacklog.slice(0, 20),
      weeklyVelocity,
      authorStats,
      featuredArticle: featuredArticle
        ? { id: featuredArticle.id, title: featuredArticle.title, views: featuredArticle.views, publishedAt: featuredArticle.publishedAt }
        : null,
    });
  } catch (err) {
    console.error("[editorial/summary]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
