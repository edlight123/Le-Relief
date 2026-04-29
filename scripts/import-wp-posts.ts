/**
 * Script: Import all WordPress posts from lereliefhaiti.com into Firebase Firestore.
 *
 * Usage:
 *   npx tsx scripts/import-wp-posts.ts
 *
 * This script:
 *  1. Fetches all categories from WP REST API and creates them in Firestore
 *  2. Creates author users in Firestore
 *  3. Paginates through all WP posts (100 per page)
 *  4. Resolves featured image URLs via the media endpoint
 *  5. Batch-writes articles to the Firestore "articles" collection
 */

import {
  initializeApp,
  applicationDefault,
  getApps,
} from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import { writeFileSync, existsSync } from "fs";
import { tmpdir, homedir } from "os";
import { join } from "path";

// ── Firebase Init ────────────────────────────────────────────────
const PROJECT_ID = "le-relief-haiti";
const SA_PATH = join(tmpdir(), "firebase-sa.json");

function ensureCredentials(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;
  if (existsSync(SA_PATH)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
    return;
  }
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    writeFileSync(SA_PATH, Buffer.from(b64, "base64").toString("utf8"), {
      mode: 0o600,
    });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
    return;
  }

  // Try Firebase CLI login token (for local dev / Codespace)
  const configDir = join(homedir(), ".config", "configstore");
  const firebaseTokenFile = join(configDir, "firebase-tools.json");
  if (existsSync(firebaseTokenFile)) {
    console.log("   Using Firebase CLI credentials");
  }
}

ensureCredentials();

const app = getApps().length === 0
  ? initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    })
  : getApps()[0]!;

const db = getFirestore(app);

// ── WordPress API ────────────────────────────────────────────────
const WP_BASE = process.env.WP_BASE_URL || "https://lereliefhaiti.com/wp-json/wp/v2";

function parseWrappedJson<T>(raw: string): T {
  const sanitizeJsonLike = (input: string): string => {
    let out = "";
    let inString = false;
    let backslashes = 0;

    const isValidEscapeChar = (c: string | undefined): boolean => {
      return c !== undefined && "\"\\/bfnrtu".includes(c);
    };

    for (let i = 0; i < input.length; i++) {
      const ch = input[i]!;
      const escaped = backslashes % 2 === 1;

      if (ch === "\\") {
        if (inString) {
          const next = input[i + 1];
          if (!isValidEscapeChar(next)) {
            // Preserve a literal backslash if proxy emitted an invalid escape.
            out += "\\\\";
            backslashes = 0;
            continue;
          }
        }

        out += ch;
        backslashes++;
        continue;
      }

      if (ch === '"' && !escaped) {
        inString = !inString;
        out += ch;
        backslashes = 0;
        continue;
      }

      if (inString) {
        if (ch === "\n") {
          out += "\\n";
        } else if (ch === "\r") {
          out += "\\r";
        } else if (ch === "\t") {
          out += "\\t";
        } else {
          const code = ch.charCodeAt(0);
          if (code < 0x20) {
            out += " ";
          } else {
            out += ch;
          }
        }
      } else {
        out += ch;
      }

      backslashes = 0;
    }

    return out;
  };

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Fallback for proxy wrappers (e.g. r.jina.ai) that prepend text before JSON.
    const arrayStart = raw.indexOf("[");
    const objectStart = raw.indexOf("{");
    const start = arrayStart === -1
      ? objectStart
      : objectStart === -1
      ? arrayStart
      : Math.min(arrayStart, objectStart);
    if (start === -1) {
      throw new Error("Unable to locate JSON payload in response");
    }

    const arrayEnd = raw.lastIndexOf("]");
    const objectEnd = raw.lastIndexOf("}");
    const end = Math.max(arrayEnd, objectEnd);
    if (end === -1 || end <= start) {
      throw new Error("Unable to detect JSON end in response");
    }

    const candidate = raw.slice(start, end + 1);

    try {
      return JSON.parse(candidate) as T;
    } catch {
      return JSON.parse(sanitizeJsonLike(candidate)) as T;
    }
  }
}

async function wpFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${WP_BASE}${endpoint}`, {
    headers: { "User-Agent": "LeRelief-Importer/1.0" },
  });
  if (!res.ok) throw new Error(`WP API error ${res.status}: ${endpoint}`);
  const text = await res.text();
  return parseWrappedJson<T>(text);
}

// ── Types ────────────────────────────────────────────────────────
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
  count: number;
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

// ── Helpers ──────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
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
    .replace(/&#\d+;/g, "")
    .trim();
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .trim();
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log("🔥 Starting Le Relief WordPress → Firestore import...\n");

  // 1) Fetch & create categories
  console.log("📂 Fetching WordPress categories...");
  const wpCategories = await wpFetch<WPCategory[]>(
    "/categories?per_page=100&_fields=id,name,slug,count"
  );
  console.log(`   Found ${wpCategories.length} categories`);

  const categoryMap = new Map<number, string>(); // WP category ID → Firestore doc ID

  // Check existing categories first
  const existingCats = await db.collection("categories").get();
  const existingCatSlugs = new Map<string, string>();
  existingCats.docs.forEach((d) => {
    existingCatSlugs.set(d.data().slug, d.id);
  });

  for (const cat of wpCategories) {
    if (existingCatSlugs.has(cat.slug)) {
      categoryMap.set(cat.id, existingCatSlugs.get(cat.slug)!);
      console.log(`   ✓ Category "${cat.name}" already exists`);
    } else {
      const ref = db.collection("categories").doc();
      await ref.set({
        name: decodeHtmlEntities(cat.name),
        slug: cat.slug,
        description: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      categoryMap.set(cat.id, ref.id);
      console.log(`   + Created category "${cat.name}" → ${ref.id}`);
    }
  }

  // 2) Fetch & create authors
  console.log("\n👤 Fetching WordPress authors...");
  const wpUsers = await wpFetch<WPUser[]>(
    "/users?per_page=100&_fields=id,name,slug"
  );
  console.log(`   Found ${wpUsers.length} authors`);

  const authorMap = new Map<number, string>(); // WP user ID → Firestore doc ID

  // Check existing users
  const existingUsers = await db.collection("users").get();
  const existingUserNames = new Map<string, string>();
  existingUsers.docs.forEach((d) => {
    existingUserNames.set(d.data().name?.toLowerCase(), d.id);
  });

  for (const user of wpUsers) {
    const nameKey = user.name.toLowerCase();
    if (existingUserNames.has(nameKey)) {
      authorMap.set(user.id, existingUserNames.get(nameKey)!);
      console.log(`   ✓ Author "${user.name}" already exists`);
    } else {
      const ref = db.collection("users").doc();
      await ref.set({
        name: user.name,
        email: `${user.slug}@lereliefhaiti.com`,
        role: "author",
        image: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      authorMap.set(user.id, ref.id);
      console.log(`   + Created author "${user.name}" → ${ref.id}`);
    }
  }

  // 3) Get total post count
  let totalPosts = 0;
  let totalPages = 0;
  try {
    const headRes = await fetch(`${WP_BASE}/posts?per_page=1`, {
      method: "HEAD",
      headers: { "User-Agent": "LeRelief-Importer/1.0" },
    });
    totalPosts = parseInt(headRes.headers.get("x-wp-total") || "0", 10);
    totalPages = parseInt(headRes.headers.get("x-wp-totalpages") || "0", 10);
  } catch (e) {
    console.warn(`⚠ Could not read WP pagination headers: ${e}`);
  }
  if (totalPages > 0) {
    console.log(`\n📰 Total posts to import: ${totalPosts} (${totalPages} pages of 100)`);
  } else {
    console.log("\n📰 Total posts unknown from headers (proxy mode) — paginating until empty page...");
  }

  // 4) Check existing articles to skip duplicates
  console.log("🔍 Checking existing articles...");
  const existingArticles = await db.collection("articles").get();
  const existingSlugs = new Set<string>();
  existingArticles.docs.forEach((d) => {
    const slug = d.data().slug;
    if (slug) existingSlugs.add(slug);
  });
  console.log(`   Found ${existingSlugs.size} existing articles — will skip duplicates\n`);

  // 5) Paginate through all posts
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Build a media cache to avoid fetching one-by-one
  const mediaCache = new Map<number, string>();

  // Stop early once we encounter a full page of already-imported slugs
  // (WP API returns posts newest-first, so older pages are guaranteed to
  // be already in Firestore once we cross that boundary).
  const STOP_ON_FULL_KNOWN_PAGE = process.env.IMPORT_FULL !== "1";

  for (let page = 1; totalPages === 0 || page <= totalPages; page++) {
    console.log(totalPages > 0 ? `📄 Page ${page}/${totalPages}...` : `📄 Page ${page}...`);

    const posts = await wpFetch<WPPost[]>(
      `/posts?per_page=100&page=${page}&_fields=id,date,slug,title,content,excerpt,featured_media,categories,author`
    );

    if (posts.length === 0) {
      console.log("   ✓ Reached empty page — stopping pagination.");
      break;
    }

    if (
      STOP_ON_FULL_KNOWN_PAGE &&
      posts.length > 0 &&
      posts.every((p) => existingSlugs.has(p.slug))
    ) {
      console.log(
        `   ⏭  All ${posts.length} posts on this page already imported — stopping early. ` +
          `Set IMPORT_FULL=1 to force a full backfill.`
      );
      skipped += posts.length;
      break;
    }

    // Collect media IDs to batch-fetch
    const mediaIds = posts
      .filter((p) => p.featured_media > 0 && !mediaCache.has(p.featured_media))
      .map((p) => p.featured_media);

    // Fetch media in chunks of 100
    if (mediaIds.length > 0) {
      const uniqueIds = [...new Set(mediaIds)];
      for (let i = 0; i < uniqueIds.length; i += 100) {
        const chunk = uniqueIds.slice(i, i + 100);
        try {
          const mediaItems = await wpFetch<WPMedia[]>(
            `/media?per_page=100&include=${chunk.join(",")}&_fields=id,source_url`
          );
          mediaItems.forEach((m) => mediaCache.set(m.id, m.source_url));
        } catch (e) {
          console.warn(`   ⚠ Failed to fetch media batch: ${e}`);
        }
      }
    }

    // Batch write posts
    const batch = db.batch();
    let batchCount = 0;

    for (const post of posts) {
      // Skip if already imported
      if (existingSlugs.has(post.slug)) {
        skipped++;
        continue;
      }

      try {
        const title = decodeHtmlEntities(post.title.rendered);
        const body = post.content.rendered;
        const excerpt = stripHtml(post.excerpt.rendered).slice(0, 500) || null;
        const coverImage = mediaCache.get(post.featured_media) || null;
        const publishedAt = new Date(post.date);

        // Map first category
        const wpCatId = post.categories[0];
        const categoryId = wpCatId ? categoryMap.get(wpCatId) || null : null;
        const authorId = authorMap.get(post.author) || authorMap.values().next().value || "unknown";

        const ref = db.collection("articles").doc();
        batch.set(ref, {
          title,
          subtitle: null,
          slug: post.slug,
          body,
          excerpt,
          coverImage,
          status: "published",
          featured: false,
          isBreaking: false,
          views: 0,
          authorId,
          categoryId,
          publishedAt: Timestamp.fromDate(publishedAt),
          createdAt: Timestamp.fromDate(publishedAt),
          updatedAt: Timestamp.fromDate(publishedAt),
          language: "fr",
          translationStatus: "not_started",
          alternateLanguageSlug: null,
          sourceArticleId: null,
        });

        batchCount++;
        imported++;
        existingSlugs.add(post.slug); // prevent duplicates within run

        // Firestore batch limit is 500
        if (batchCount >= 400) {
          await batch.commit();
          console.log(`   ✓ Committed batch of ${batchCount} articles`);
          batchCount = 0;
        }
      } catch (e) {
        errors++;
        console.error(`   ✗ Error importing post "${post.slug}":`, e);
      }
    }

    // Commit remaining in batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✓ Committed batch of ${batchCount} articles`);
    }

    console.log(`   Progress: ${imported} imported, ${skipped} skipped, ${errors} errors`);

    // Small delay to be respectful to the WP server
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n" + "═".repeat(50));
  console.log(`✅ Import complete!`);
  console.log(`   📰 Articles imported: ${imported}`);
  console.log(`   ⏭  Articles skipped:  ${skipped}`);
  console.log(`   ❌ Errors:            ${errors}`);
  console.log(`   📂 Categories:        ${categoryMap.size}`);
  console.log(`   👤 Authors:           ${authorMap.size}`);
  console.log("═".repeat(50));
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
