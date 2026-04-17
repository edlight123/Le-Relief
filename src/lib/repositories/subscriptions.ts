import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";

const COLLECTION = "subscriptions";

function collection() {
  return getDb().collection(COLLECTION);
}

export async function getSubscriptionByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const snap = await collection().where("email", "==", normalized).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>);
}

export async function subscribeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await getSubscriptionByEmail(normalized);
  const now = FieldValue.serverTimestamp();

  if (existing) {
    await collection().doc(existing.id as string).update({
      active: true,
      updatedAt: now,
    });
    return getSubscriptionByEmail(normalized);
  }

  const ref = collection().doc();
  await ref.set({
    email: normalized,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const snap = await ref.get();
  return serializeTimestamps({ id: ref.id, ...snap.data() } as Record<string, unknown>);
}
