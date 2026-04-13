import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";

const COLLECTION = "users";

function collection() {
  return getDb().collection(COLLECTION);
}

export async function createUser(data: {
  name: string;
  email: string;
  hashedPassword: string;
  role?: string;
  image?: string | null;
}) {
  const ref = collection().doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    ...data,
    role: data.role || "reader",
    image: data.image || null,
    emailVerified: null,
    createdAt: now,
    updatedAt: now,
  });
  const snap = await ref.get();
  return serializeTimestamps({ id: ref.id, ...snap.data() } as Record<string, unknown>);
}

export async function findByEmail(email: string) {
  const snap = await collection().where("email", "==", email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>);
}

export async function getUser(id: string) {
  const snap = await collection().doc(id).get();
  if (!snap.exists) return null;
  return serializeTimestamps({ id: snap.id, ...snap.data() } as Record<string, unknown>);
}

export async function getUsers() {
  const snap = await collection().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>));
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  );
  await collection()
    .doc(id)
    .update({ ...clean, updatedAt: FieldValue.serverTimestamp() });
  return getUser(id);
}

export async function countUsers() {
  const snap = await collection().count().get();
  return snap.data().count;
}
