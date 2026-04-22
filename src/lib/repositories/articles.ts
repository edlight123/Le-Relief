import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";
import { validateSourceArticleReference } from "@/lib/validation";
import type { CreateArticleInput, UpdateArticleInput } from "@/types/article";

const COLLECTION = "articles";

function collection() {
  return getDb().collection(COLLECTION);
}

type ArticleDoc = Record<string, unknown> & {
  id?: string;
  language?: string;
  status?: string;
  sourceArticleId?: string | null;
  isCanonicalSource?: boolean;
  allowTranslation?: boolean;
};

type CreateArticleRepoInput = CreateArticleInput & {
  slug: string;
  authorId: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  coverImageCaption?: string | null;
  categoryId?: string | null;
  publishedAt?: Date | null;
  scheduledAt?: string | null;
};

function normalizeLanguageFields<T extends object>(data: T): T & Record<string, unknown> {
  const normalized = data as T & Record<string, unknown>;
  const language = (normalized.language as string | undefined) || "fr";

  if (language === "en") {
    return {
      ...normalized,
      language: "en",
      isCanonicalSource: false,
      translationStatus: (normalized.translationStatus as string | undefined) || "not_started",
      sourceArticleId: (normalized.sourceArticleId as string | null | undefined) || null,
    };
  }

  return {
    ...normalized,
    language: "fr",
    isCanonicalSource: true,
    translationStatus: "not_applicable",
    sourceArticleId: null,
  };
}

export async function createArticle(data: CreateArticleRepoInput) {
  const normalizedInput = normalizeLanguageFields(data);
  const sourceValidation = await validateSourceArticleReference(
    (normalizedInput.language as string) || "fr",
    (normalizedInput.sourceArticleId as string | null | undefined) ?? null,
  );
  if (!sourceValidation.valid) {
    throw new Error(sourceValidation.error || "Référence source invalide");
  }

  const ref = collection().doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    ...normalizedInput,
    subtitle: normalizedInput.subtitle || null,
    excerpt: normalizedInput.excerpt || null,
    seoTitle: (normalizedInput.seoTitle as string | null | undefined) || null,
    metaDescription: (normalizedInput.metaDescription as string | null | undefined) || null,
    canonicalUrl: (normalizedInput.canonicalUrl as string | null | undefined) || null,
    coverImage: normalizedInput.coverImage || null,
    coverImageCaption: normalizedInput.coverImageCaption || null,
    tags: (normalizedInput.tags as string[] | undefined) || [],
    status: (normalizedInput.status as string | undefined) || "draft",
    featured: Boolean(normalizedInput.featured),
    categoryId: (normalizedInput.categoryId as string | null | undefined) || null,
    contentType: (normalizedInput.contentType as string | undefined) || "actualite",
    language: normalizedInput.language || "fr",
    translationStatus: normalizedInput.translationStatus || "not_applicable",
    isCanonicalSource: normalizedInput.isCanonicalSource,
    sourceArticleId: (normalizedInput.sourceArticleId as string | null | undefined) || null,
    alternateLanguageSlug: (normalizedInput.alternateLanguageSlug as string | null | undefined) || null,
    allowTranslation: normalizedInput.language === "fr" ? Boolean(normalizedInput.allowTranslation) : false,
    translationPriority: (normalizedInput.translationPriority as string | null | undefined) || null,
    publishedAt: (normalizedInput.publishedAt as Date | null | undefined) || null,
    scheduledAt: (normalizedInput.scheduledAt as string | null | undefined) || null,
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

export async function findBySlug(slug: string, language?: string) {
  let query = collection().where("slug", "==", slug) as FirebaseFirestore.Query;
  if (language) {
    query = query.where("language", "==", language);
  }
  const snap = await query.limit(1).get();
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
  sourceArticleId?: string;
  excludeId?: string;
  orderBy?: string;
}) {
  let baseQuery = collection() as FirebaseFirestore.Query;
  const normalizedSearch = options?.search?.trim();
  const normalizedLanguage =
    options?.language === "fr" || options?.language === "en"
      ? options.language
      : undefined;

  if (options?.status) {
    baseQuery = baseQuery.where("status", "==", options.status);
  }
  if (options?.featured !== undefined) {
    baseQuery = baseQuery.where("featured", "==", options.featured);
  }
  if (options?.categoryId) {
    baseQuery = baseQuery.where("categoryId", "==", options.categoryId);
  }
  if (options?.authorId) {
    baseQuery = baseQuery.where("authorId", "==", options.authorId);
  }
  if (normalizedLanguage) {
    baseQuery = baseQuery.where("language", "==", normalizedLanguage);
  }
  if (options?.sourceArticleId) {
    baseQuery = baseQuery.where("sourceArticleId", "==", options.sourceArticleId);
  }

  if (options?.before) {
    const beforeField = options?.orderBy || "publishedAt";
    baseQuery = baseQuery.where(beforeField, "<", new Date(options.before));
  }

  const totalQuery = baseQuery;
  const orderField = options?.orderBy || "publishedAt";
  let query = baseQuery.orderBy(orderField, "desc");

  const needsClientFilter = !!(normalizedSearch || options?.excludeId);
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
  if (normalizedSearch) {
    const term = normalizedSearch.toLowerCase();
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

  let total = docs.length;
  if (!needsClientFilter) {
    try {
      const totalSnap = await totalQuery.count().get();
      total = totalSnap.data().count;
    } catch {
      total = docs.length;
    }
  }
  const skip = options?.skip || 0;
  const take = options?.take || 20;
  if (needsClientFilter || options?.skip) {
    docs = docs.slice(skip, skip + take);
  }

  return { articles: docs, total };
}

export async function updateArticle(
  id: string,
  data: Partial<Omit<UpdateArticleInput, "id">> & Record<string, unknown>,
) {
  const existing = await getArticle(id);
  if (!existing) return null;

  const nextLanguage = (data.language as string | undefined) ?? (existing.language as string) ?? "fr";
  const proposedSource =
    data.sourceArticleId !== undefined
      ? (data.sourceArticleId as string | null | undefined)
      : (existing.sourceArticleId as string | null | undefined);

  const normalized = normalizeLanguageFields({
    ...data,
    language: nextLanguage,
    sourceArticleId: nextLanguage === "fr" ? null : proposedSource,
    isCanonicalSource: nextLanguage === "fr",
  });

  const sourceValidation = await validateSourceArticleReference(
    (normalized.language as string) || "fr",
    (normalized.sourceArticleId as string | null | undefined) ?? null,
  );
  if (!sourceValidation.valid) {
    throw new Error(sourceValidation.error || "Référence source invalide");
  }

  const clean = Object.fromEntries(
    Object.entries(normalized).filter(([, v]) => v !== undefined),
  );
  await collection()
    .doc(id)
    .update({ ...clean, updatedAt: FieldValue.serverTimestamp() });
  return getArticle(id);
}

export async function deleteArticle(id: string) {
  const article = await getArticle(id);
  if (article?.language === "fr") {
    const dependents = await getArticlesBySourceId(id);
    if (dependents.length > 0) {
      throw new Error("Remove EN translations first");
    }
  }

  await collection().doc(id).delete();
}

export async function getArticlesBySourceId(sourceArticleId: string) {
  const snap = await collection()
    .where("language", "==", "en")
    .where("sourceArticleId", "==", sourceArticleId)
    .get();

  return snap.docs.map((d) =>
    serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
  );
}

export async function getOrphanedEnArticles() {
  const enSnap = await collection().where("language", "==", "en").get();
  const orphaned = enSnap.docs
    .map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>))
    .filter((article) => !article.sourceArticleId);

  return orphaned;
}

export async function getInvalidSourceReferences() {
  const enSnap = await collection().where("language", "==", "en").get();
  const enArticles = enSnap.docs.map((d) =>
    serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>) as ArticleDoc,
  );

  const invalid: Array<{ article: Record<string, unknown>; error: string }> = [];

  for (const article of enArticles) {
    const result = await validateSourceArticleReference("en", (article.sourceArticleId as string | null | undefined) ?? null);
    if (!result.valid) {
      invalid.push({
        article: article as Record<string, unknown>,
        error: result.error || "Référence source invalide",
      });
    }
  }

  return invalid;
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

export async function getPublishedArticles(take: number = 6, language?: string) {
  let query = collection().where("status", "==", "published") as FirebaseFirestore.Query;
  if (language) {
    query = query.where("language", "==", language);
  }
  const snap = await query
    .orderBy("publishedAt", "desc")
    .limit(take)
    .get();
  return snap.docs.map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>));
}

export async function getTopArticlesByViews(take: number = 10) {
  const snap = await collection()
    .orderBy("views", "desc")
    .limit(take * 3)
    .get();
  const docs = snap.docs.map((d) => serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>));
  return docs.filter((d) => d.status === "published").slice(0, take);
}
