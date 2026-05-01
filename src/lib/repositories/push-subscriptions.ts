import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase";

const COLLECTION = "pushSubscriptions";

function collection() {
  return getDb().collection(COLLECTION);
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  locale?: string;
  createdAt?: unknown;
}

export async function saveSubscription(data: PushSubscriptionData): Promise<string> {
  // Use endpoint hash as doc ID so duplicate subscribes are idempotent
  const docId = Buffer.from(data.endpoint).toString("base64url").slice(0, 40);
  await collection()
    .doc(docId)
    .set({ ...data, createdAt: FieldValue.serverTimestamp() }, { merge: true });
  return docId;
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const docId = Buffer.from(endpoint).toString("base64url").slice(0, 40);
  await collection().doc(docId).delete();
}

export async function getAllSubscriptions(): Promise<(PushSubscriptionData & { id: string })[]> {
  const snap = await collection().get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PushSubscriptionData) }));
}

export async function getSubscriptionsByLocale(
  locale: string,
): Promise<(PushSubscriptionData & { id: string })[]> {
  const snap = await collection().where("locale", "==", locale).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PushSubscriptionData) }));
}
