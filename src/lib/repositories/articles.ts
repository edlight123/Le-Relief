import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";

const COLLECTION = "articles";

function collection() {
  return getDb().collection(COLLECTION);
}

export async function createArticle(data: {
  title: string;
  subtitle?: string | null;
  slug: string;
  body: string;
  excerpt?: string | null;
  coverImage?: string | null;
  coverImageCaption?: string | null;
  tags?: string[];
  status?: string;
  featured?: boolean;
  authorId: string;
  categoryId?: string | null;
  contentType?: string;
  language?: string;
  translationStatus?: string;
  isCanonicalSource?: boolean;
  sourceArticleId?: string | null;
  alternateLanguageSlug?: string | null;
  allowTranslation?: boolean;
  translationPriority?: string | null;
  publishedAt?: Date | null;
  scheduledAt?: string | null;
}) {
  const ref = collection().doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    ...data,
    subtitle: data.subtitle || null,
    excerpt: data.excerpt || null,
    coverImage: data.coverImage || null,
    coverImageCaption: data.coverImageCaption || null,
    tags: data.tags || [],
    status: data.status || "draft",
    featured: data.featured || false,
    categoryId: data.categoryId || null,
    contentType: data.contentType || "actualite",
    language: data.language || "fr",
    translationStatus: data.translationStatus || "not_started",
    isCanonicalSource: data.isCanonicalSource ?? data.language !== "en",
    sourceArticleId: data.sourceArticleId || null,
    alternateLanguageSlug: data.alternateLanguageSlug || null,
    allowTranslation: data.allowTranslation ?? false,
    translationPriority: data.translationPriority || null,
    publishedAt: data.publishedAt || null,
    scheduledAt: data.scheduledAt || null,
    views: 0,
    createdAt: now,
    updatedAt: now,
  });
  const snap = await ref.get();
  return serializeTimestamps({ id: ref.id, ...snap.data() } as Record<string, unknown>);
}

export async function getArticle(id: string) {
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

export async function getArticles(options?: {
  status?: string;
  search?: string;
  take?: number;
  skip?: number;
  before?: string;
  featured?: boolean;
  categoryId?: string;
  authorId?: string;
  language?: string;
  excludeId?: string;
  orderBy?: string;
}) {
  let query = collection() as FirebaseFirestore.Query;

  if (options?.status) {
    query = query.where("status", "==", options.status);
  }
  if (options?.featured !== undefined) {
    query = query.where("featured", "==", options.featured);
  }
  if (options?.categoryId) {
    query = query.where("categoryId", "==", options.categoryId);
  }
  if (options?.authorId) {
    query = query.where("authorId", "==", options.authorId);
  }
  if (options?.language) {
    query = query.where("language", "==", options.language);
  }

  const orderField = options?.orderBy || "publishedAt";
  query = query.orderBy(orderField, "desc");

  if (options?.before) {
    query = query.where(orderField, "<", options.before);
  }

  const needsClientFilter = !!(options?.search || options?.excludeId);
  if (!options?.skip) {
    // For search/excludeId we fetch more than needed then filter down client-side,
    // but always cap at 500 to avoid reading the whole collection.
    const firestoreLimit = needsClientFilter
      ? Math.min(500, (options?.take || 20) * 20)
      : options?.take || 20;
    query = query.limit(firestoreLimit);
  }

  const snap = await query.get();
  let docs = snap.docs.map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>));

  // Client-side filtering for search (Firestore doesn't support full-text search)
  if (options?.search) {
    const term = options.search.toLowerCase();
    docs = docs.filter(
      (d) =>
        (d.title as string)?.toLowerCase().includes(term) ||
        (d.excerpt as string)?.toLowerCase().includes(term) ||
        (d.body as string)?.toLowerCase().includes(term)
    );
  }

  if (options?.excludeId) {
    docs = docs.filter((d) => d.id !== options.excludeId);
  }

  const total = docs.length;
  const skip = options?.skip || 0;
  const take = options?.take || 20;
  if (needsClientFilter || options?.skip) {
    docs = docs.slice(skip, skip + take);
  }

  return { articles: docs, total };
}

export async function updateArticle(id: string, data: Record<string, unknown>) {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  );
  await collection()
    .doc(id)
    .update({ ...clean, updatedAt: FieldValue.serverTimestamp() });
  return getArticle(id);
}

export async function deleteArticle(id: string) {
  await collection().doc(id).delete();
}

export async function incrementViews(id: string) {
  await collection().doc(id).update({
    views: FieldValue.increment(1),
  });
}

export async function countArticles(status?: string) {
  let query = collection() as FirebaseFirestore.Query;
  if (status) {
    query = query.where("status", "==", status);
  }
  const snap = await query.count().get();
  return snap.data().count;
}

export async function sumViews() {
  const snap = await collection().get();
  return snap.docs.reduce((sum, d) => sum + ((d.data().views as number) || 0), 0);
}

export async function getRecentArticles(take: number = 5) {
  const snap = await collection()
    .orderBy("updatedAt", "desc")
    .limit(take)
    .get();
  return snap.docs.map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>));
}

export async function getFeaturedArticle() {
  const snap = await collection()
    .where("status", "==", "published")
    .where("featured", "==", true)
    .orderBy("publishedAt", "desc")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>);
}

export async function getPublishedArticles(take: number = 6) {
  const snap = await collection()
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc")
    .limit(take)
    .get();
  return snap.docs.map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>));
}
