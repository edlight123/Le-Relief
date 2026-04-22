import { getDb, serializeTimestamps } from "@/lib/firebase";

export interface WorkflowTimingStats {
  /** Average hours from article_created → submitted_for_review */
  avgDraftToReview: number | null;
  /** Average hours from submitted_for_review → approved */
  avgReviewToApproved: number | null;
  /** Average hours from approved → published */
  avgApprovedToPublished: number | null;
  /** Percentage of submitted articles that received at least one revision_requested */
  revisionRate: number;
  /** Total articles that have been through the review pipeline */
  totalArticlesSubmitted: number;
  /** Total articles that were revised at least once */
  totalRevised: number;
}

export interface BlockedArticleInfo {
  articleId: string;
  title: string;
  status: string;
  blockingCount: number;
}

export interface DailyPublicationPoint {
  date: string;
  count: number;
}

/** Compute workflow pipeline timing stats from the audit event log. */
export async function getWorkflowTimingStats(): Promise<WorkflowTimingStats> {
  const db = getDb();

  const auditSnap = await db
    .collection("editorialAuditEvents")
    .orderBy("createdAt", "asc")
    .limit(2000)
    .get();

  const events = auditSnap.docs.map((d) =>
    serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
  );

  // Group events by articleId
  const byArticle: Record<string, typeof events> = {};
  for (const ev of events) {
    const aid = ev.articleId as string;
    if (!byArticle[aid]) byArticle[aid] = [];
    byArticle[aid]!.push(ev);
  }

  const draftToReviewDeltas: number[] = [];
  const reviewToApprovedDeltas: number[] = [];
  const approvedToPublishedDeltas: number[] = [];
  let totalRevised = 0;
  const articlesSubmitted = new Set<string>();

  for (const [articleId, articleEvents] of Object.entries(byArticle)) {
    const created = articleEvents.find((e) => e.type === "article_created");
    const submitted = articleEvents.find((e) => e.type === "submitted_for_review");
    const approved = articleEvents.find((e) => e.type === "approved");
    const published = articleEvents.find((e) => e.type === "published");
    const wasRevised = articleEvents.some((e) => e.type === "revision_requested");

    if (submitted) {
      articlesSubmitted.add(articleId);
      if (wasRevised) totalRevised++;
    }

    if (created && submitted) {
      const delta =
        (new Date(submitted.createdAt as string).getTime() -
          new Date(created.createdAt as string).getTime()) /
        (1000 * 60 * 60);
      // Sanity bounds: 0 → 1 year
      if (delta >= 0 && delta < 8760) draftToReviewDeltas.push(delta);
    }

    if (submitted && approved) {
      const delta =
        (new Date(approved.createdAt as string).getTime() -
          new Date(submitted.createdAt as string).getTime()) /
        (1000 * 60 * 60);
      if (delta >= 0 && delta < 8760) reviewToApprovedDeltas.push(delta);
    }

    if (approved && published) {
      const delta =
        (new Date(published.createdAt as string).getTime() -
          new Date(approved.createdAt as string).getTime()) /
        (1000 * 60 * 60);
      if (delta >= 0 && delta < 8760) approvedToPublishedDeltas.push(delta);
    }
  }

  const avg = (arr: number[]): number | null =>
    arr.length > 0
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
      : null;

  return {
    avgDraftToReview: avg(draftToReviewDeltas),
    avgReviewToApproved: avg(reviewToApprovedDeltas),
    avgApprovedToPublished: avg(approvedToPublishedDeltas),
    revisionRate:
      articlesSubmitted.size > 0
        ? Math.round((totalRevised / articlesSubmitted.size) * 100)
        : 0,
    totalArticlesSubmitted: articlesSubmitted.size,
    totalRevised,
  };
}

/** Return articles currently blocked by unresolved blocking editorial comments. */
export async function getBlockedArticles(): Promise<BlockedArticleInfo[]> {
  const db = getDb();

  const snap = await db
    .collection("editorialComments")
    .where("type", "==", "blocking")
    .where("resolved", "==", false)
    .limit(100)
    .get();

  const byArticle: Record<string, number> = {};
  for (const doc of snap.docs) {
    const data = doc.data();
    const aid = data.articleId as string;
    byArticle[aid] = (byArticle[aid] || 0) + 1;
  }

  const results: BlockedArticleInfo[] = [];
  for (const [articleId, blockingCount] of Object.entries(byArticle)) {
    const articleSnap = await db.collection("articles").doc(articleId).get();
    if (articleSnap.exists) {
      results.push({
        articleId,
        title: (articleSnap.data()?.title as string) || "Sans titre",
        status: (articleSnap.data()?.status as string) || "unknown",
        blockingCount,
      });
    }
  }

  return results.sort((a, b) => b.blockingCount - a.blockingCount);
}

/**
 * Return a day-by-day publication count for the last `days` days,
 * sourced from the audit event log (type === "published").
 */
export async function getDailyPublicationRate(
  days: number = 30,
): Promise<DailyPublicationPoint[]> {
  const db = getDb();

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const snap = await db
    .collection("editorialAuditEvents")
    .where("type", "==", "published")
    .where("createdAt", ">=", since)
    .orderBy("createdAt", "asc")
    .get();

  const byDate: Record<string, number> = {};
  for (const doc of snap.docs) {
    const data = serializeTimestamps({
      id: doc.id,
      ...doc.data(),
    } as Record<string, unknown>);
    const d = new Date(data.createdAt as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    byDate[key] = (byDate[key] || 0) + 1;
  }

  const result: DailyPublicationPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    result.push({ date: label, count: byDate[key] || 0 });
  }

  return result;
}
