import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";

const COLLECTION = "social_links";

function collection() {
  return getDb().collection(COLLECTION);
}

export async function getSocialLinks() {
  const snap = await collection().get();
  return snap.docs.map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>));
}

export async function upsertSocialLink(platform: string, url: string) {
  const existing = await collection().where("platform", "==", platform).limit(1).get();
  const now = FieldValue.serverTimestamp();
  if (!existing.empty) {
    const doc = existing.docs[0]!;
    await doc.ref.update({ url, updatedAt: now });
  } else {
    const ref = collection().doc();
    await ref.set({ platform, url, createdAt: now, updatedAt: now });
  }
}
