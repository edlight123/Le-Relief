/**
 * Import the public WordPress site data from lereliefhaiti.com into Firestore.
 *
 * The current app already reads articles/categories/users/media from Firestore.
 * This script keeps those collections deduped, while also preserving the
 * WordPress source data in wp_* collections for the later refactor.
 *
 * Usage:
 *   npx tsx scripts/import-wp-site.ts
 *
 * Optional env:
 *   WP_FETCH_MODE=direct   Fetch WordPress directly instead of through r.jina.ai.
 *   WP_PER_PAGE=100        WordPress REST pagination size.
 */

import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";

const WP_ORIGIN = process.env.WP_ORIGIN ?? "https://lereliefhaiti.com";
const WP_BASE = `${WP_ORIGIN.replace(/\/$/, "")}/wp-json/wp/v2`;
const JINA_READER_BASE = "https://r.jina.ai/http://";
const FETCH_MODE = process.env.WP_FETCH_MODE ?? "jina";
const PER_PAGE = Number(process.env.WP_PER_PAGE ?? 100);
const REQUEST_TIMEOUT_MS = Number(process.env.WP_REQUEST_TIMEOUT_MS ?? 90000);
const FETCH_DELAY_MS = Number(
  process.env.WP_FETCH_DELAY_MS ?? (FETCH_MODE === "jina" ? 3500 : 250),
);
const BATCH_LIMIT = 400;
const MAX_SOURCE_DOC_BYTES = 900_000;
let lastFetchAt = 0;

type JsonRecord = Record<string, unknown>;

interface WpEnvelope<T> {
  body: T;
  status: number;
  headers: {
    "X-WP-Total"?: number | string;
    "X-WP-TotalPages"?: number | string;
    [key: string]: unknown;
  };
}

interface WpRendered {
  rendered?: string;
}

interface WpTerm {
  id: number;
  count?: number;
  description?: string;
  link?: string;
  name: string;
  slug: string;
  taxonomy?: string;
  parent?: number;
}

interface WpUser {
  id: number;
  name: string;
  slug: string;
  link?: string;
  description?: string;
  avatar_urls?: Record<string, string>;
}

interface WpMedia {
  id: number;
  date?: string;
  modified?: string;
  slug?: string;
  type?: string;
  link?: string;
  title?: WpRendered;
  author?: number;
  caption?: WpRendered;
  alt_text?: string;
  media_type?: string;
  mime_type?: string;
  source_url?: string;
  media_details?: {
    width?: number;
    height?: number;
    filesize?: number;
    file?: string;
    sizes?: JsonRecord;
  };
  post?: number;
}

interface WpPost {
  id: number;
  date: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: WpRendered;
  content: WpRendered & { protected?: boolean };
  excerpt: WpRendered & { protected?: boolean };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  comment_status?: string;
  sticky?: boolean;
  template?: string;
  format?: string;
  meta?: JsonRecord;
  yoast_head_json?: JsonRecord;
}

interface WpPage {
  id: number;
  date: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: WpRendered;
  author: number;
  featured_media: number;
  parent?: number;
  menu_order?: number;
  template?: string;
  yoast_head_json?: JsonRecord;
}

interface ImportStats {
  fetched: number;
  sourceCreated: number;
  appCreated: number;
  skipped: number;
  errors: number;
}

class BatchWriter {
  private batch = this.db.batch();
  private count = 0;
  writes = 0;

  constructor(private db: Firestore) {}

  async set(
    ref: DocumentReference,
    data: FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData>,
    options?: FirebaseFirestore.SetOptions,
  ) {
    if (options) {
      this.batch.set(ref, data, options);
    } else {
      this.batch.set(ref, data);
    }
    this.count += 1;
    this.writes += 1;

    if (this.count >= BATCH_LIMIT) {
      await this.flush();
    }
  }

  async flush() {
    if (this.count === 0) return;
    await this.batch.commit();
    this.batch = this.db.batch();
    this.count = 0;
  }
}

function initDb(): Firestore {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY",
    );
  }

  privateKey = privateKey.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  return getFirestore();
}

function decodeHtmlEntities(text = ""): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/&hellip;/g, "...")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    )
    .trim();
}

function stripHtml(html = ""): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseWpDate(value?: string): Timestamp | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

function defined<T extends JsonRecord>(value: T): T {
  const clean = Array.isArray(value)
    ? value.map((item) =>
        item && typeof item === "object"
          ? defined(item as JsonRecord)
          : item,
      )
    : Object.fromEntries(
        Object.entries(value)
          .filter(([, entry]) => entry !== undefined)
          .map(([key, entry]) => [
            key,
            entry && typeof entry === "object" && !(entry instanceof Date)
              ? defined(entry as JsonRecord)
              : entry,
          ]),
      );

  return clean as T;
}

function jsonByteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function sourceDoc<T extends JsonRecord>(
  item: T,
  sourceType: string,
  extra: JsonRecord = {},
) {
  return defined({
    ...item,
    ...extra,
    source: {
      origin: WP_ORIGIN,
      type: sourceType,
      wpId: item.id,
    },
    importedAt: FieldValue.serverTimestamp(),
  });
}

function compactSourceDoc<T extends JsonRecord>(
  item: T,
  sourceType: string,
  extra: JsonRecord = {},
) {
  const doc = sourceDoc(item, sourceType, extra);
  if (jsonByteLength(doc) <= MAX_SOURCE_DOC_BYTES) return doc;

  const compact = sourceDoc(
    {
      id: item.id,
      slug: item.slug,
      type: item.type,
      link: item.link,
      title: item.title,
      date: item.date,
      modified: item.modified,
    },
    sourceType,
    {
      ...extra,
      omittedLargeFields: true,
      originalByteLength: jsonByteLength(doc),
    },
  );

  return compact;
}

function wpUrl(endpoint: string, params: URLSearchParams): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const target = `${WP_BASE}${cleanEndpoint}?${params.toString()}`;
  if (FETCH_MODE === "direct") return target;
  return `${JINA_READER_BASE}${target}`;
}

async function waitForFetchSlot() {
  const elapsed = Date.now() - lastFetchAt;
  const waitMs = FETCH_DELAY_MS - elapsed;
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastFetchAt = Date.now();
}

function retryAfterMs(text: string): number | null {
  try {
    const parsed = JSON.parse(text) as { retryAfter?: number };
    if (typeof parsed.retryAfter === "number") {
      return (parsed.retryAfter + 1) * 1000;
    }
  } catch {
    const match = text.match(/"retryAfter"\s*:\s*(\d+)/);
    if (match?.[1]) return (Number(match[1]) + 1) * 1000;
  }
  return null;
}

function findJsonEnd(input: string): number {
  const start = input.search(/[\[{]/);
  if (start < 0) return -1;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i += 1) {
    const char = input[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      stack.push(char === "{" ? "}" : "]");
    } else if (char === "}" || char === "]") {
      const expected = stack.pop();
      if (expected !== char) return -1;
      if (stack.length === 0) return i + 1;
    }
  }

  return -1;
}

function repairJsonStrings(input: string): string {
  let output = "";
  let inString = false;
  let escaped = false;
  const validEscapes = new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]!;
    const code = char.charCodeAt(0);

    if (!inString) {
      if (char === '"') inString = true;
      output += char;
      continue;
    }

    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      const next = input[i + 1];
      if (next && validEscapes.has(next)) {
        output += char;
        escaped = true;
      } else {
        output += "\\\\";
      }
      continue;
    }

    if (char === '"') {
      output += char;
      inString = false;
      continue;
    }

    if (code <= 0x1f) {
      if (char === "\n") output += "\\n";
      else if (char === "\r") output += "\\r";
      else if (char === "\t") output += "\\t";
      else output += `\\u${code.toString(16).padStart(4, "0")}`;
      continue;
    }

    output += char;
  }

  return output;
}

function parseJinaJson<T>(text: string): T {
  const marker = "Markdown Content:";
  const markerIndex = text.indexOf(marker);
  let body =
    markerIndex >= 0 ? text.slice(markerIndex + marker.length) : text;

  body = body.trim().replace(/<\/pre><\/body><\/html>\s*$/i, "").trim();
  const jsonStart = body.search(/[\[{]/);
  if (jsonStart < 0) {
    throw new Error("Could not find JSON in response");
  }

  body = body.slice(jsonStart);
  const jsonEnd = findJsonEnd(body);
  const json = jsonEnd > 0 ? body.slice(0, jsonEnd) : body;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return JSON.parse(repairJsonStrings(json)) as T;
    }
    throw error;
  }
}

async function fetchJson<T>(endpoint: string, params: URLSearchParams): Promise<T> {
  const url = wpUrl(endpoint, params);
  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await waitForFetchSlot();
      const res = await fetch(url, {
        headers: { "User-Agent": "LeRelief-Firestore-Importer/1.0" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const text = await res.text();
      if (!res.ok) {
        const error = new Error(
          `Fetch failed ${res.status}: ${text.slice(0, 300)}`,
        ) as Error & { retryAfterMs?: number | null };
        error.retryAfterMs = res.status === 429 ? retryAfterMs(text) : null;
        throw error;
      }

      return FETCH_MODE === "direct"
        ? (JSON.parse(text) as T)
        : parseJinaJson<T>(text);
    } catch (error) {
      lastError = error;
      const waitMs =
        typeof (error as { retryAfterMs?: unknown }).retryAfterMs === "number"
          ? ((error as { retryAfterMs: number }).retryAfterMs)
          : attempt * 1500;
      console.warn(
        `  Fetch retry ${attempt}/5 for ${endpoint}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function parseJinaMarkdown(text: string): string {
  const marker = "Markdown Content:";
  const markerIndex = text.indexOf(marker);
  return (markerIndex >= 0 ? text.slice(markerIndex + marker.length) : text)
    .trim()
    .replace(/<\/pre><\/body><\/html>\s*$/i, "")
    .trim();
}

async function fetchRenderedPage(url: string): Promise<string> {
  const target = FETCH_MODE === "direct" ? url : `${JINA_READER_BASE}${url}`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await waitForFetchSlot();
      const res = await fetch(target, {
        headers: { "User-Agent": "LeRelief-Firestore-Importer/1.0" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const text = await res.text();
      if (!res.ok) {
        const error = new Error(
          `Fetch failed ${res.status}: ${text.slice(0, 300)}`,
        ) as Error & { retryAfterMs?: number | null };
        error.retryAfterMs = res.status === 429 ? retryAfterMs(text) : null;
        throw error;
      }
      return FETCH_MODE === "direct" ? text : parseJinaMarkdown(text);
    } catch (error) {
      lastError = error;
      const waitMs =
        typeof (error as { retryAfterMs?: unknown }).retryAfterMs === "number"
          ? (error as { retryAfterMs: number }).retryAfterMs
          : attempt * 1500;
      console.warn(
        `  Page render retry ${attempt}/5 for ${url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function wpEnvelope<T>(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<WpEnvelope<T>> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }
  search.set("_envelope", "1");

  const envelope = await fetchJson<WpEnvelope<T>>(endpoint, search);
  if (envelope.status >= 400) {
    throw new Error(
      `WordPress API error ${envelope.status} for ${endpoint}: ${JSON.stringify(
        envelope.body,
      ).slice(0, 300)}`,
    );
  }
  return envelope;
}

async function fetchAll<T>(
  label: string,
  endpoint: string,
  fields: string,
): Promise<T[]> {
  const first = await wpEnvelope<T[]>(endpoint, {
    per_page: PER_PAGE,
    page: 1,
    _fields: fields,
  });

  const total = Number(first.headers["X-WP-Total"] ?? first.body.length);
  const totalPages = Number(first.headers["X-WP-TotalPages"] ?? 1);
  const items = [...first.body];
  console.log(`  ${label}: ${total} records across ${totalPages} page(s)`);

  for (let page = 2; page <= totalPages; page += 1) {
    const envelope = await wpEnvelope<T[]>(endpoint, {
      per_page: PER_PAGE,
      page,
      _fields: fields,
    });
    items.push(...envelope.body);
    console.log(`    fetched ${label} page ${page}/${totalPages}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return items;
}

async function existingIds(db: Firestore, collection: string): Promise<Set<string>> {
  const snap = await db.collection(collection).select().get();
  return new Set(snap.docs.map((doc) => doc.id));
}

async function existingByField(
  db: Firestore,
  collection: string,
  field: string,
): Promise<Map<string, string>> {
  const snap = await db.collection(collection).select(field).get();
  const map = new Map<string, string>();
  for (const doc of snap.docs) {
    const value = doc.get(field);
    if (typeof value === "string" && value.trim()) {
      map.set(value.toLowerCase(), doc.id);
    }
  }
  return map;
}

function mediaFilename(url?: string): string {
  if (!url) return "wordpress-media";
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : "wordpress-media";
  } catch {
    const last = url.split("/").filter(Boolean).pop();
    return last || "wordpress-media";
  }
}

function markdownExcerpt(markdown: string): string | null {
  const text = markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#*_`>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.slice(0, 500) : null;
}

async function importCategories(
  db: Firestore,
  writer: BatchWriter,
): Promise<{ stats: ImportStats; map: Map<number, string> }> {
  console.log("\nImporting categories...");
  const categories = await fetchAll<WpTerm>(
    "categories",
    "/categories",
    "id,count,description,link,name,slug,taxonomy,parent",
  );

  const sourceIds = await existingIds(db, "wp_categories");
  const existingCategories = await existingByField(db, "categories", "slug");
  const map = new Map<number, string>();
  const stats: ImportStats = {
    fetched: categories.length,
    sourceCreated: 0,
    appCreated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const category of categories) {
    const sourceId = String(category.id);
    if (!sourceIds.has(sourceId)) {
      await writer.set(
        db.collection("wp_categories").doc(sourceId),
        sourceDoc(category as unknown as JsonRecord, "category"),
      );
      sourceIds.add(sourceId);
      stats.sourceCreated += 1;
    }

    const slugKey = category.slug.toLowerCase();
    const existingId = existingCategories.get(slugKey);
    if (existingId) {
      map.set(category.id, existingId);
      stats.skipped += 1;
      continue;
    }

    const ref = db.collection("categories").doc();
    await writer.set(ref, {
      name: decodeHtmlEntities(category.name),
      slug: category.slug,
      description: category.description || null,
      source: {
        origin: WP_ORIGIN,
        type: "category",
        wpId: category.id,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    existingCategories.set(slugKey, ref.id);
    map.set(category.id, ref.id);
    stats.appCreated += 1;
  }

  return { stats, map };
}

async function importTags(
  db: Firestore,
  writer: BatchWriter,
): Promise<{ stats: ImportStats; map: Map<number, string> }> {
  console.log("\nImporting tags...");
  const tags = await fetchAll<WpTerm>(
    "tags",
    "/tags",
    "id,count,description,link,name,slug,taxonomy",
  );

  const sourceIds = await existingIds(db, "wp_tags");
  const existingTags = await existingByField(db, "tags", "slug");
  const map = new Map<number, string>();
  const stats: ImportStats = {
    fetched: tags.length,
    sourceCreated: 0,
    appCreated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const tag of tags) {
    const sourceId = String(tag.id);
    if (!sourceIds.has(sourceId)) {
      await writer.set(
        db.collection("wp_tags").doc(sourceId),
        sourceDoc(tag as unknown as JsonRecord, "tag"),
      );
      sourceIds.add(sourceId);
      stats.sourceCreated += 1;
    }

    const slugKey = tag.slug.toLowerCase();
    const existingId = existingTags.get(slugKey);
    if (existingId) {
      map.set(tag.id, existingId);
      stats.skipped += 1;
      continue;
    }

    const ref = db.collection("tags").doc();
    await writer.set(ref, {
      name: decodeHtmlEntities(tag.name),
      slug: tag.slug,
      description: tag.description || null,
      source: {
        origin: WP_ORIGIN,
        type: "tag",
        wpId: tag.id,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    existingTags.set(slugKey, ref.id);
    map.set(tag.id, ref.id);
    stats.appCreated += 1;
  }

  return { stats, map };
}

async function importUsers(
  db: Firestore,
  writer: BatchWriter,
): Promise<{ stats: ImportStats; map: Map<number, string> }> {
  console.log("\nImporting public authors...");
  const users = await fetchAll<WpUser>(
    "users",
    "/users",
    "id,name,slug,link,description,avatar_urls",
  );

  const sourceIds = await existingIds(db, "wp_users");
  const byEmail = await existingByField(db, "users", "email");
  const byName = await existingByField(db, "users", "name");
  const map = new Map<number, string>();
  const stats: ImportStats = {
    fetched: users.length,
    sourceCreated: 0,
    appCreated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const user of users) {
    const sourceId = String(user.id);
    if (!sourceIds.has(sourceId)) {
      await writer.set(
        db.collection("wp_users").doc(sourceId),
        sourceDoc(user as unknown as JsonRecord, "user"),
      );
      sourceIds.add(sourceId);
      stats.sourceCreated += 1;
    }

    const email = `${user.slug}@lereliefhaiti.com`;
    const existingId =
      byEmail.get(email.toLowerCase()) || byName.get(user.name.toLowerCase());

    if (existingId) {
      map.set(user.id, existingId);
      stats.skipped += 1;
      continue;
    }

    const ref = db.collection("users").doc();
    await writer.set(ref, {
      name: user.name,
      email,
      role: "author",
      image: user.avatar_urls?.["96"] ?? null,
      emailVerified: null,
      source: {
        origin: WP_ORIGIN,
        type: "user",
        wpId: user.id,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    byEmail.set(email.toLowerCase(), ref.id);
    byName.set(user.name.toLowerCase(), ref.id);
    map.set(user.id, ref.id);
    stats.appCreated += 1;
  }

  return { stats, map };
}

async function importMedia(
  db: Firestore,
  writer: BatchWriter,
): Promise<{ stats: ImportStats; map: Map<number, string> }> {
  console.log("\nImporting media metadata...");
  const sourceIds = await existingIds(db, "wp_media");
  if (sourceIds.size > 0 && process.env.WP_FORCE_MEDIA_FETCH !== "1") {
    const snap = await db.collection("wp_media").select("id", "source_url").get();
    const map = new Map<number, string>();
    for (const doc of snap.docs) {
      const wpId = doc.get("id");
      const sourceUrl = doc.get("source_url");
      if (typeof wpId === "number" && typeof sourceUrl === "string") {
        map.set(wpId, sourceUrl);
      }
    }

    return {
      map,
      stats: {
        fetched: map.size,
        sourceCreated: 0,
        appCreated: 0,
        skipped: map.size,
        errors: 0,
      },
    };
  }

  const mediaItems = await fetchAll<WpMedia>(
    "media",
    "/media",
    [
      "id",
      "date",
      "modified",
      "slug",
      "type",
      "link",
      "title",
      "author",
      "caption",
      "alt_text",
      "media_type",
      "mime_type",
      "source_url",
      "media_details",
      "post",
    ].join(","),
  );

  const existingMedia = await existingByField(db, "media", "url");
  const map = new Map<number, string>();
  const stats: ImportStats = {
    fetched: mediaItems.length,
    sourceCreated: 0,
    appCreated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const media of mediaItems) {
    const sourceId = String(media.id);
    if (!sourceIds.has(sourceId)) {
      await writer.set(
        db.collection("wp_media").doc(sourceId),
        sourceDoc(media as unknown as JsonRecord, "media"),
      );
      sourceIds.add(sourceId);
      stats.sourceCreated += 1;
    }

    const url = media.source_url;
    if (!url) {
      stats.skipped += 1;
      continue;
    }

    const existingId = existingMedia.get(url.toLowerCase());
    if (existingId) {
      map.set(media.id, url);
      stats.skipped += 1;
      continue;
    }

    const ref = db.collection("media").doc();
    await writer.set(ref, {
      filename: mediaFilename(url),
      url,
      type: media.mime_type || media.media_type || "application/octet-stream",
      size: media.media_details?.filesize ?? 0,
      alt: media.alt_text || stripHtml(media.caption?.rendered) || null,
      width: media.media_details?.width ?? null,
      height: media.media_details?.height ?? null,
      source: {
        origin: WP_ORIGIN,
        type: "media",
        wpId: media.id,
        postId: media.post ?? null,
      },
      createdAt: parseWpDate(media.date) ?? FieldValue.serverTimestamp(),
    });
    existingMedia.set(url.toLowerCase(), ref.id);
    map.set(media.id, url);
    stats.appCreated += 1;
  }

  return { stats, map };
}

async function importPages(
  db: Firestore,
  writer: BatchWriter,
  authorMap: Map<number, string>,
  mediaMap: Map<number, string>,
): Promise<ImportStats> {
  console.log("\nImporting pages...");
  const pages = await fetchAll<WpPage>(
    "pages",
    "/pages",
    [
      "id",
      "date",
      "date_gmt",
      "modified",
      "modified_gmt",
      "slug",
      "status",
      "type",
      "link",
      "title",
      "author",
      "featured_media",
      "parent",
      "menu_order",
      "template",
      "yoast_head_json",
    ].join(","),
  );

  const sourceIds = await existingIds(db, "wp_pages");
  const pageIds = await existingIds(db, "site_pages");
  const stats: ImportStats = {
    fetched: pages.length,
    sourceCreated: 0,
    appCreated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const page of pages) {
    const renderedMarkdown = await fetchRenderedPage(page.link);
    const sourceId = String(page.id);
    if (!sourceIds.has(sourceId)) {
      await writer.set(
        db.collection("wp_pages").doc(sourceId),
        compactSourceDoc(page as unknown as JsonRecord, "page", {
          renderedMarkdown,
        }),
      );
      sourceIds.add(sourceId);
      stats.sourceCreated += 1;
    }

    const sitePageId = `wp-${page.id}`;
    if (pageIds.has(sitePageId)) {
      stats.skipped += 1;
      continue;
    }

    await writer.set(db.collection("site_pages").doc(sitePageId), {
      title: decodeHtmlEntities(page.title?.rendered ?? ""),
      slug: page.slug,
      body: renderedMarkdown,
      excerpt: markdownExcerpt(renderedMarkdown),
      link: page.link,
      status: page.status,
      parentWpId: page.parent ?? 0,
      menuOrder: page.menu_order ?? 0,
      template: page.template || null,
      coverImage: mediaMap.get(page.featured_media) ?? null,
      authorId: authorMap.get(page.author) ?? null,
      publishedAt: parseWpDate(page.date),
      modifiedAt: parseWpDate(page.modified),
      source: {
        origin: WP_ORIGIN,
        type: "page",
        wpId: page.id,
      },
      createdAt: parseWpDate(page.date) ?? FieldValue.serverTimestamp(),
      updatedAt: parseWpDate(page.modified) ?? FieldValue.serverTimestamp(),
    });
    pageIds.add(sitePageId);
    stats.appCreated += 1;
  }

  return stats;
}

async function importPosts(
  db: Firestore,
  writer: BatchWriter,
  categoryMap: Map<number, string>,
  authorMap: Map<number, string>,
  mediaMap: Map<number, string>,
): Promise<ImportStats> {
  console.log("\nImporting posts/articles...");
  const posts = await fetchAll<WpPost>(
    "posts",
    "/posts",
    [
      "id",
      "date",
      "date_gmt",
      "modified",
      "modified_gmt",
      "slug",
      "status",
      "type",
      "link",
      "title",
      "content",
      "excerpt",
      "author",
      "featured_media",
      "categories",
      "tags",
      "comment_status",
      "sticky",
      "template",
      "format",
      "meta",
      "yoast_head_json",
    ].join(","),
  );

  const sourceIds = await existingIds(db, "wp_posts");
  const existingArticles = await existingByField(db, "articles", "slug");
  const fallbackAuthorId = authorMap.values().next().value as string | undefined;
  const stats: ImportStats = {
    fetched: posts.length,
    sourceCreated: 0,
    appCreated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const post of posts) {
    const sourceId = String(post.id);
    if (!sourceIds.has(sourceId)) {
      await writer.set(
        db.collection("wp_posts").doc(sourceId),
        compactSourceDoc(post as unknown as JsonRecord, "post"),
      );
      sourceIds.add(sourceId);
      stats.sourceCreated += 1;
    }

    const slugKey = post.slug.toLowerCase();
    if (existingArticles.has(slugKey)) {
      stats.skipped += 1;
      continue;
    }

    const categoryId = post.categories?.[0]
      ? categoryMap.get(post.categories[0]) ?? null
      : null;
    const authorId = authorMap.get(post.author) ?? fallbackAuthorId ?? null;
    if (!authorId) {
      stats.errors += 1;
      console.warn(`  Skipping article ${post.id}: no author available`);
      continue;
    }

    const ref = db.collection("articles").doc();
    await writer.set(ref, {
      title: decodeHtmlEntities(post.title?.rendered ?? ""),
      subtitle: null,
      slug: post.slug,
      body: post.content?.rendered ?? "",
      excerpt: stripHtml(post.excerpt?.rendered).slice(0, 500) || null,
      coverImage: mediaMap.get(post.featured_media) ?? null,
      status: post.status === "publish" ? "published" : "draft",
      featured: Boolean(post.sticky),
      views: 0,
      authorId,
      categoryId,
      source: {
        origin: WP_ORIGIN,
        type: "post",
        wpId: post.id,
        link: post.link,
      },
      publishedAt: parseWpDate(post.date),
      createdAt: parseWpDate(post.date) ?? FieldValue.serverTimestamp(),
      updatedAt: parseWpDate(post.modified) ?? FieldValue.serverTimestamp(),
    });

    existingArticles.set(slugKey, ref.id);
    stats.appCreated += 1;
  }

  return stats;
}

function printStats(label: string, stats: ImportStats) {
  console.log(
    `  ${label}: fetched=${stats.fetched}, sourceCreated=${stats.sourceCreated}, appCreated=${stats.appCreated}, skipped=${stats.skipped}, errors=${stats.errors}`,
  );
}

async function main() {
  console.log("Starting Le Relief WordPress site import");
  console.log(`  origin: ${WP_ORIGIN}`);
  console.log(`  fetch mode: ${FETCH_MODE}`);

  const db = initDb();
  const writer = new BatchWriter(db);

  const categoryResult = await importCategories(db, writer);
  await writer.flush();
  printStats("categories", categoryResult.stats);

  const tagResult = await importTags(db, writer);
  await writer.flush();
  printStats("tags", tagResult.stats);

  const userResult = await importUsers(db, writer);
  await writer.flush();
  printStats("users", userResult.stats);

  const mediaResult = await importMedia(db, writer);
  await writer.flush();
  printStats("media", mediaResult.stats);

  const pageStats = await importPages(
    db,
    writer,
    userResult.map,
    mediaResult.map,
  );
  await writer.flush();
  printStats("pages", pageStats);

  const postStats = await importPosts(
    db,
    writer,
    categoryResult.map,
    userResult.map,
    mediaResult.map,
  );
  await writer.flush();
  printStats("posts", postStats);

  console.log("\nImport complete");
  console.log(`  Firestore writes committed: ${writer.writes}`);
}

main().catch((error) => {
  console.error("Fatal import error:", error);
  process.exit(1);
});
