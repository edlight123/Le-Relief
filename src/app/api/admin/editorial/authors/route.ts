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
    const articlesSnap = await db.collection("articles").get();
    const articles = articlesSnap.docs.map((d) =>
      serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
    );

    // Aggregate per author
    const authorMap: Record<string, { articleCount: number; views: number; publishedCount: number }> = {};
    for (const a of articles) {
      const authorId = (a.authorId as string) || "unknown";
      if (!authorMap[authorId]) authorMap[authorId] = { articleCount: 0, views: 0, publishedCount: 0 };
      authorMap[authorId].articleCount++;
      authorMap[authorId].views += (a.views as number) || 0;
      if (a.status === "published") authorMap[authorId].publishedCount++;
    }

    // Fetch user info
    const authorIds = Object.keys(authorMap);
    const authors = await Promise.all(
      authorIds.map(async (id) => {
        const snap = await db.collection("users").doc(id).get();
        const user = snap.exists ? serializeTimestamps({ id: snap.id, ...snap.data() } as Record<string, unknown>) : { id, name: "Inconnu" };
        return {
          id,
          name: user.name,
          image: user.image,
          email: user.email,
          ...authorMap[id],
          avgViews: authorMap[id]!.articleCount > 0
            ? Math.round(authorMap[id]!.views / authorMap[id]!.articleCount)
            : 0,
        };
      }),
    );

    authors.sort((a, b) => b.articleCount - a.articleCount);

    return NextResponse.json({ authors });
  } catch (err) {
    console.error("[editorial/authors]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
