import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getDb } from "@/lib/firebase";

export const runtime = "nodejs";
export const maxDuration = 60;

const WP_BASE = "https://lereliefhaiti.com/wp-json/wp/v2";
const DEFAULT_POST_LIMIT = 25;
const MAX_POST_LIMIT = 50;

interface WPPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  categories: number[];
  author: number;
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
}

interface WPUser {
  id: number;
  name: string;
  slug: string;
}

interface WPMedia {
  id: number;
  source_url: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number.parseInt(n, 10)))
    .trim();
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

async function wpFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${WP_BASE}${endpoint}`, {
    headers: { "User-Agent": "LeRelief-WP-Sync/1.0" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`WP API error ${res.status} for ${endpoint}`);
  }

  return (await res.json()) as T;
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_POST_LIMIT;
  return Math.max(1, Math.min(MAX_POST_LIMIT, parsed));
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = getDb();
  const limit = parseLimit(req.nextUrl.searchParams.get("limit"));

  const [wpCategories, wpUsers, wpPosts] = await Promise.all([
    wpFetch<WPCategory[]>("/categories?per_page=100&_fields=id,name,slug"),
    wpFetch<WPUser[]>("/users?per_page=100&_fields=id,name,slug"),
    wpFetch<WPPost[]>(
      `/posts?per_page=${limit}&page=1&_fields=id,date,slug,title,content,excerpt,featured_media,categories,author`,
    ),
  ]);

  const existingCategories = await db.collection("categories").get();
  const categoryBySlug = new Map<string, string>();
  for (const doc of existingCategories.docs) {
    const slug = doc.data().slug;
    if (typeof slug === "string") categoryBySlug.set(slug, doc.id);
  }

  const categoryMap = new Map<number, string>();
  for (const wpCategory of wpCategories) {
    const existingId = categoryBySlug.get(wpCategory.slug);
    if (existingId) {
      categoryMap.set(wpCategory.id, existingId);
      continue;
    }

    const ref = db.collection("categories").doc();
    await ref.set({
      name: decodeHtmlEntities(wpCategory.name),
      slug: wpCategory.slug,
      description: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    categoryMap.set(wpCategory.id, ref.id);
    categoryBySlug.set(wpCategory.slug, ref.id);
  }

  const existingUsers = await db.collection("users").get();
  const userByName = new Map<string, string>();
  for (const doc of existingUsers.docs) {
    const name = doc.data().name;
    if (typeof name === "string" && name.trim()) {
      userByName.set(name.toLowerCase(), doc.id);
    }
  }

  const authorMap = new Map<number, string>();
  for (const wpUser of wpUsers) {
    const key = wpUser.name.toLowerCase();
    const existingId = userByName.get(key);

    if (existingId) {
      authorMap.set(wpUser.id, existingId);
      continue;
    }

    const ref = db.collection("users").doc();
    await ref.set({
      name: wpUser.name,
      email: `${wpUser.slug}@lereliefhaiti.com`,
      role: "author",
      image: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    authorMap.set(wpUser.id, ref.id);
    userByName.set(key, ref.id);
  }

  const mediaIds = [...new Set(wpPosts.map((post) => post.featured_media).filter((id) => id > 0))];
  const mediaMap = new Map<number, string>();

  for (let i = 0; i < mediaIds.length; i += 100) {
    const chunk = mediaIds.slice(i, i + 100);
    if (chunk.length === 0) continue;

    try {
      const mediaItems = await wpFetch<WPMedia[]>(
        `/media?per_page=100&include=${chunk.join(",")}&_fields=id,source_url`,
      );
      for (const media of mediaItems) {
        mediaMap.set(media.id, media.source_url);
      }
    } catch {
      // Keep sync resilient even if some media records fail.
    }
  }

  const existingArticles = await db.collection("articles").get();
  const existingSlugs = new Set<string>();
  for (const doc of existingArticles.docs) {
    const slug = doc.data().slug;
    if (typeof slug === "string" && slug.trim()) existingSlugs.add(slug);
  }

  let imported = 0;
  let skipped = 0;

  for (const post of wpPosts) {
    if (existingSlugs.has(post.slug)) {
      skipped++;
      continue;
    }

    const title = decodeHtmlEntities(post.title.rendered);
    const excerpt = stripHtml(post.excerpt.rendered).slice(0, 500) || null;
    const categoryId = post.categories[0] ? categoryMap.get(post.categories[0]) || null : null;
    const authorId = authorMap.get(post.author) || null;
    const coverImage = mediaMap.get(post.featured_media) || null;
    const publishedAt = new Date(post.date);

    const ref = db.collection("articles").doc();
    await ref.set({
      title,
      subtitle: null,
      slug: post.slug,
      body: post.content.rendered,
      excerpt,
      coverImage,
      status: "published",
      featured: false,
      views: 0,
      authorId,
      categoryId,
      contentType: "actualite",
      language: "fr",
      translationStatus: "not_applicable",
      isCanonicalSource: true,
      sourceArticleId: null,
      alternateLanguageSlug: null,
      allowTranslation: true,
      translationPriority: null,
      publishedAt: Timestamp.fromDate(publishedAt),
      createdAt: Timestamp.fromDate(publishedAt),
      updatedAt: Timestamp.fromDate(publishedAt),
    });

    existingSlugs.add(post.slug);
    imported++;
  }

  return NextResponse.json({
    ok: true,
    source: "lereliefhaiti.com",
    scanned: wpPosts.length,
    imported,
    skipped,
  });
}
