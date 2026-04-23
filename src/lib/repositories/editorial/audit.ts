import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";

const COLLECTION = "editorialAuditEvents";

function collection() {
  return getDb().collection(COLLECTION);
}

export type EditorialEventType =
  | "article_created"
  | "article_updated"
  | "submitted_for_review"
  | "revision_requested"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published"
  | "unpublished"
  | "archived"
  | "homepage_assigned"
  | "metadata_updated"
  | "comment_added"
  | "comment_resolved";

export async function logEditorialEvent(input: {
  articleId: string;
  actorId: string;
  type: EditorialEventType;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const ref = collection().doc();
  await ref.set({
    articleId: input.articleId,
    actorId: input.actorId,
    type: input.type,
    fromStatus: input.fromStatus || null,
    toStatus: input.toStatus || null,
    note: input.note || null,
    metadata: input.metadata || null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getArticleHistory(articleId: string) {
  const snap = await collection()
    .where("articleId", "==", articleId)
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  return snap.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>),
  );
}

export async function getRecentEditorialEvents(limit = 100) {
  const snap = await collection().orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>),
  );
}
