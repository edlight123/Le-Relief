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
    const articlesSnap = await db.collection("articles")
      .where("status", "==", "published")
      .get();
    const articles = articlesSnap.docs.map((d) =>
      serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
    );

    // Views by category
    const byCategoryViews: Record<string, { views: number; count: number; name?: string }> = {};
    for (const a of articles) {
      const catId = (a.categoryId as string) || "uncategorized";
      if (!byCategoryViews[catId]) byCategoryViews[catId] = { views: 0, count: 0 };
      byCategoryViews[catId].views += (a.views as number) || 0;
      byCategoryViews[catId].count++;
    }

    // Enrich with category names
    const catIds = Object.keys(byCategoryViews).filter((id) => id !== "uncategorized");
    await Promise.all(
      catIds.map(async (catId) => {
        const snap = await db.collection("categories").doc(catId).get();
        if (snap.exists) {
          const data = snap.data();
          if (byCategoryViews[catId]) {
            byCategoryViews[catId].name = (data?.name as string) || catId;
          }
        }
      }),
    );

    const categories = Object.entries(byCategoryViews)
      .map(([id, data]) => ({ id, name: data.name || id, views: data.views, count: data.count }))
      .sort((a, b) => b.views - a.views);

    const mostPopular = categories[0] || null;

    return NextResponse.json({ categories, mostPopular });
  } catch (err) {
    console.error("[product/categories]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
