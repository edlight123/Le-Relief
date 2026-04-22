import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";

const COLLECTION = "notifications";

function collection() {
  return getDb().collection(COLLECTION);
}

export interface NotificationData {
  userId: string;
  type:
    | "article_submitted"
    | "article_approved"
    | "article_rejected"
    | "revision_requested"
    | "article_published"
    | "comment_added";
  articleId: string;
  articleTitle?: string;
  message: string;
  actorName?: string;
}

export async function createNotification(data: NotificationData) {
  const ref = collection().doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({ ...data, readAt: null, createdAt: now });
  return ref.id;
}

export async function getUserNotifications(userId: string, limit = 30) {
  const snap = await collection()
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) =>
    serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
  );
}

export async function markAsRead(notificationId: string) {
  await collection().doc(notificationId).update({ readAt: FieldValue.serverTimestamp() });
}

export async function markAllAsRead(userId: string) {
  const snap = await collection()
    .where("userId", "==", userId)
    .where("readAt", "==", null)
    .get();
  const batch = getDb().batch();
  snap.docs.forEach((d) => batch.update(d.ref, { readAt: FieldValue.serverTimestamp() }));
  await batch.commit();
}

export async function countUnread(userId: string) {
  const snap = await collection()
    .where("userId", "==", userId)
    .where("readAt", "==", null)
    .count()
    .get();
  return snap.data().count;
}
