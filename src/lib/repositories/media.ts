import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase";

const COLLECTION = "media";

function collection() {
  return getDb().collection(COLLECTION);
}

export async function createMedia(data: {
  filename: string;
  url: string;
  type: string;
  size: number;
  alt?: string | null;
}) {
  const ref = collection().doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    ...data,
    alt: data.alt || null,
    createdAt: now,
  });
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() } as Record<string, unknown>;
}

export async function getMedia() {
  const snap = await collection().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
}

export async function getMediaItem(id: string) {
  const snap = await collection().doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Record<string, unknown>;
}

export async function deleteMedia(id: string) {
  await collection().doc(id).delete();
}
