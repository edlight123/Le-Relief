import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";

const COLLECTION = "categories";

function collection() {
  return getDb().collection(COLLECTION);
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  const ref = collection().doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    ...data,
    description: data.description || null,
    createdAt: now,
    updatedAt: now,
  });
  const snap = await ref.get();
  return serializeTimestamps({ id: ref.id, ...snap.data() } as Record<string, unknown>);
}

export async function getCategory(id: string) {
  const snap = await collection().doc(id).get();
  if (!snap.exists) return null;
  return serializeTimestamps({ id: snap.id, ...snap.data() } as Record<string, unknown>);
}

export async function findBySlug(slug: string) {
  const snap = await collection().where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>);
}

export async function getCategories() {
  const snap = await collection().orderBy("name", "asc").get();
  return snap.docs.map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>));
}

/**
 * Get all categories with article counts.
 * Since Firestore doesn't support joins, we query articles separately.
 */
export async function getCategoriesWithCounts(publishedOnly = false) {
  const categories = await getCategories();
  // Only fetch categoryId and status fields to minimize data transfer
  const articlesSnap = await getDb().collection("articles").select("categoryId", "status").get();
  const articles = articlesSnap.docs.map((d) => d.data());

  return categories.map((cat) => {
    const count = articles.filter((a) => {
      const matchCategory = a.categoryId === cat.id;
      if (publishedOnly) return matchCategory && a.status === "published";
      return matchCategory;
    }).length;
    return { ...cat, _count: { articles: count } } as Record<string, unknown> & { _count: { articles: number } };
  });
}

export async function updateCategory(
  id: string,
  data: { name?: string; slug?: string; description?: string | null }
) {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  await collection()
    .doc(id)
    .update({ ...clean, updatedAt: FieldValue.serverTimestamp() });

  return getCategory(id);
}

export async function deleteCategory(id: string) {
  await collection().doc(id).delete();
}
