import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrphanedEnArticles, getInvalidSourceReferences } from "@/lib/repositories/articles";
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
    const allArticles = articlesSnap.docs.map((d) =>
      serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
    );

    const [orphaned, invalidRefs] = await Promise.all([
      getOrphanedEnArticles(),
      getInvalidSourceReferences(),
    ]);

    // Missing metadata: published articles without cover image, excerpt, or category
    const missingMetadata = allArticles
      .filter((a) => a.status === "published")
      .filter((a) => !a.coverImage || !a.excerpt || !a.categoryId)
      .map((a) => ({
        id: a.id,
        title: a.title,
        language: a.language,
        missingFields: [
          !a.coverImage ? "coverImage" : null,
          !a.excerpt ? "excerpt" : null,
          !a.categoryId ? "categoryId" : null,
        ].filter(Boolean),
      }));

    return NextResponse.json({
      orphanedEnArticles: orphaned.map((a) => ({ id: a.id, title: a.title })),
      invalidSourceReferences: invalidRefs.map((r) => ({ id: r.article.id, title: r.article.title, error: r.error })),
      missingMetadata,
      summary: {
        orphanedCount: orphaned.length,
        invalidRefCount: invalidRefs.length,
        missingMetadataCount: missingMetadata.length,
        totalIssues: orphaned.length + invalidRefs.length + missingMetadata.length,
      },
    });
  } catch (err) {
    console.error("[content-health]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
