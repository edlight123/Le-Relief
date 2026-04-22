import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeWorkflowRole, canAccessDashboard } from "@/lib/editorial-workflow";
import {
  getWorkflowTimingStats,
  getBlockedArticles,
  getDailyPublicationRate,
} from "@/lib/repositories/editorial/kpis";
import { getDb, serializeTimestamps } from "@/lib/firebase";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/editorial-kpis
 *
 * Returns editorial production KPIs:
 *   - Workflow pipeline timing (draft→review, review→approved, approved→published)
 *   - Revision rate
 *   - Blocked articles (unresolved blocking comments)
 *   - Daily publication counts (last 30 days)
 *   - Status breakdown for all editorial statuses
 *   - Breaking / homepage-pinned counts
 *
 * Requires: editor | publisher | admin role
 */
export async function GET() {
  const session = await auth();
  const role = normalizeWorkflowRole(
    (session?.user as { role?: string } | undefined)?.role || "",
  );

  if (!session || !canAccessDashboard(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = getDb();

  // Fetch all articles for counts
  const snap = await db.collection("articles").get();
  const allArticles = snap.docs.map((d) =>
    serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
  );

  const statusBreakdown: Record<string, number> = {
    draft: 0,
    in_review: 0,
    revision_requested: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
    rejected: 0,
    archived: 0,
  };
  let breakingCount = 0;
  let homepagePinnedCount = 0;

  for (const a of allArticles) {
    const s = (a.status as string) || "draft";
    const normalizedStatus = s === "pending_review" ? "in_review" : s;
    if (normalizedStatus in statusBreakdown) {
      statusBreakdown[normalizedStatus]!++;
    }
    if (a.isBreaking === true) breakingCount++;
    if (a.isHomepagePinned === true) homepagePinnedCount++;
  }

  const [timingStats, blockedArticles, dailyRate] = await Promise.all([
    getWorkflowTimingStats(),
    getBlockedArticles(),
    getDailyPublicationRate(30),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    statusBreakdown,
    breakingCount,
    homepagePinnedCount,
    totalArticles: allArticles.length,
    workflow: {
      avgDraftToReviewHours: timingStats.avgDraftToReview,
      avgReviewToApprovedHours: timingStats.avgReviewToApproved,
      avgApprovedToPublishedHours: timingStats.avgApprovedToPublished,
      revisionRate: timingStats.revisionRate,
      totalArticlesSubmitted: timingStats.totalArticlesSubmitted,
      totalRevised: timingStats.totalRevised,
    },
    blockedArticles,
    dailyPublicationRate: dailyRate,
  });
}
