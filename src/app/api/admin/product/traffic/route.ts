import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, serializeTimestamps } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "admin" && role !== "publisher")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();

    // Articles
    const articlesSnap = await db.collection("articles").get();
    const articles = articlesSnap.docs.map((d) =>
      serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
    );

    const publishedArticles = articles.filter((a) => a.status === "published");
    const frPublished = publishedArticles.filter((a) => a.language === "fr");
    const enPublished = publishedArticles.filter((a) => a.language === "en");

    const totalViews = publishedArticles.reduce((sum, a) => sum + ((a.views as number) || 0), 0);
    const frViews = frPublished.reduce((sum, a) => sum + ((a.views as number) || 0), 0);
    const enViews = enPublished.reduce((sum, a) => sum + ((a.views as number) || 0), 0);

    // Top articles
    const topArticles = [...publishedArticles]
      .sort((a, b) => ((b.views as number) || 0) - ((a.views as number) || 0))
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        title: a.title,
        views: a.views,
        language: a.language,
        publishedAt: a.publishedAt,
        categoryId: a.categoryId,
      }));

    // Subscribers from Firestore (subscriptions collection)
    let totalSubscribers = 0;
    let signupsThisWeek = 0;
    let signupsThisMonth = 0;

    try {
      const subsSnap = await db.collection("subscriptions").get();
      const subs = subsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
      totalSubscribers = subs.length;

      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);

      signupsThisWeek = subs.filter((s) => {
        const createdAt = s.createdAt ? new Date(s.createdAt as string) : null;
        return createdAt && createdAt >= weekAgo;
      }).length;

      signupsThisMonth = subs.filter((s) => {
        const createdAt = s.createdAt ? new Date(s.createdAt as string) : null;
        return createdAt && createdAt >= monthAgo;
      }).length;
    } catch {
      // subscriptions collection may not exist
    }

    return NextResponse.json({
      totalViews,
      frViews,
      enViews,
      frViewsPercent: totalViews > 0 ? Math.round((frViews / totalViews) * 100) : 0,
      enViewsPercent: totalViews > 0 ? Math.round((enViews / totalViews) * 100) : 0,
      publishedCount: publishedArticles.length,
      frPublished: frPublished.length,
      enPublished: enPublished.length,
      topArticles,
      newsletter: {
        totalSubscribers,
        signupsThisWeek,
        signupsThisMonth,
      },
    });
  } catch (err) {
    console.error("[product/traffic]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
