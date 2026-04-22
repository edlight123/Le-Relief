import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";

const COLLECTION = "editorialComments";

function collection() {
  return getDb().collection(COLLECTION);
}

export type EditorialCommentType = "comment" | "blocking" | "revision_note";

export async function addComment(input: {
  articleId: string;
  authorId: string;
  type: EditorialCommentType;
  body: string;
}) {
  const ref = collection().doc();
  await ref.set({
    articleId: input.articleId,
    authorId: input.authorId,
    type: input.type,
    body: input.body,
    resolvedAt: null,
    resolvedBy: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snap = await ref.get();
  return serializeTimestamps({ id: ref.id, ...snap.data() } as Record<string, unknown>);
}

export async function getCommentsByArticle(articleId: string) {
  const snap = await collection()
    .where("articleId", "==", articleId)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>),
  );
}

export async function resolveComment(commentId: string, resolverId: string) {
  await collection().doc(commentId).update({
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedBy: resolverId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snap = await collection().doc(commentId).get();
  if (!snap.exists) return null;
  return serializeTimestamps({ id: snap.id, ...snap.data() } as Record<string, unknown>);
}

export async function getUnresolvedBlockingComments(articleId: string) {
  const snap = await collection()
    .where("articleId", "==", articleId)
    .where("type", "==", "blocking")
    .where("resolvedAt", "==", null)
    .get();

  return snap.docs.map((doc) =>
    serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>),
  );
}
