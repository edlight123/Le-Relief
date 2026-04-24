/**
 * Download article pictures from the current Firestore articles collection and
 * upload them to Firebase Storage.
 *
 * Usage:
 *   npx tsx scripts/upload-article-images-to-storage.ts
 *
 * Optional env:
 *   ARTICLE_IMAGE_IMPORT_LIMIT=10
 *   ARTICLE_IMAGE_IMPORT_CONCURRENCY=5
 *   ARTICLE_IMAGE_FORCE=1
 *   FIREBASE_STORAGE_BUCKET=le-relief-haiti.firebasestorage.app
 */

import "dotenv/config";
import crypto from "crypto";
import path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
  type DocumentReference,
  type Firestore,
  type WriteBatch,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type Bucket = ReturnType<ReturnType<typeof getStorage>["bucket"]>;

const WP_ORIGIN = "https://lereliefhaiti.com";
const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

const LIMIT = Number(process.env.ARTICLE_IMAGE_IMPORT_LIMIT ?? 0);
const CONCURRENCY = Math.max(
  1,
  Number(process.env.ARTICLE_IMAGE_IMPORT_CONCURRENCY ?? 5),
);
const FORCE = process.env.ARTICLE_IMAGE_FORCE === "1";
const REQUEST_TIMEOUT_MS = Number(
  process.env.ARTICLE_IMAGE_REQUEST_TIMEOUT_MS ?? 60000,
);

interface ArticleImageInfo {
  id: string;
  sourceUrl: string;
  storagePath: string;
  coverArticleIds: Set<string>;
  coverArticleSlugs: Set<string>;
  embeddedArticleIds: Set<string>;
  embeddedArticleSlugs: Set<string>;
}

interface PreparedArticleImage {
  id: string;
  sourceUrl: string;
  storagePath: string;
  coverArticleIds: string[];
  coverArticleSlugs: string[];
  embeddedArticleIds: string[];
  embeddedArticleSlugs: string[];
}

interface DownloadedImage {
  buffer: Buffer;
  contentType: string;
  byteSize: number;
}

interface UploadResult {
  status: "uploaded" | "skipped" | "failed";
  id: string;
  sourceUrl: string;
  error?: string;
}

interface ImportStats {
  uploaded: number;
  skipped: number;
  failed: number;
}

function initFirebase() {
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

  return { projectId };
}

async function resolveBucket(projectId: string): Promise<Bucket> {
  const candidates = [
    process.env.FIREBASE_STORAGE_BUCKET,
    `${projectId}.firebasestorage.app`,
    `${projectId}.appspot.com`,
  ].filter(Boolean) as string[];

  for (const name of candidates) {
    const bucket = getStorage().bucket(name);
    try {
      const [exists] = await bucket.exists();
      if (exists) return bucket;
    } catch (error) {
      console.warn(
        `  Could not inspect bucket ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  throw new Error(`No Firebase Storage bucket found for ${projectId}`);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function imageId(sourceUrl: string): string {
  return crypto.createHash("sha256").update(sourceUrl).digest("hex").slice(0, 32);
}

function isArticleImageUrl(url: URL): boolean {
  const isLeRelief =
    url.hostname === "lereliefhaiti.com" ||
    url.hostname === "www.lereliefhaiti.com";
  if (!isLeRelief || !url.pathname.includes("/wp-content/uploads/")) {
    return false;
  }

  return IMAGE_EXTENSIONS.has(path.extname(url.pathname).toLowerCase());
}

function normalizeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    const url = new URL(decodeHtmlEntities(raw), WP_ORIGIN);
    url.hash = "";
    url.search = "";
    if (!isArticleImageUrl(url)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function storagePathForUrl(sourceUrl: string, id: string): string {
  const url = new URL(sourceUrl);
  const match = url.pathname.match(/\/wp-content\/uploads\/(.+)$/);
  const relativePath = match?.[1] ?? `${id}-${path.basename(url.pathname)}`;
  return `wordpress/article-images/${decodeURIComponent(relativePath)}`.replace(
    /\/+/g,
    "/",
  );
}

function addImage(
  images: Map<string, ArticleImageInfo>,
  rawUrl: unknown,
  articleId: string,
  slug: string,
  role: "cover" | "embedded",
) {
  const sourceUrl = normalizeImageUrl(rawUrl);
  if (!sourceUrl) return;

  const id = imageId(sourceUrl);
  let info = images.get(sourceUrl);
  if (!info) {
    info = {
      id,
      sourceUrl,
      storagePath: storagePathForUrl(sourceUrl, id),
      coverArticleIds: new Set<string>(),
      coverArticleSlugs: new Set<string>(),
      embeddedArticleIds: new Set<string>(),
      embeddedArticleSlugs: new Set<string>(),
    };
    images.set(sourceUrl, info);
  }

  if (role === "cover") {
    info.coverArticleIds.add(articleId);
    info.coverArticleSlugs.add(slug);
  } else {
    info.embeddedArticleIds.add(articleId);
    info.embeddedArticleSlugs.add(slug);
  }
}

function extractBodyImageUrls(body: string): string[] {
  const urls = new Set<string>();
  const attrPattern = /(?:src|data-src)=["']([^"']+)["']/gi;
  const srcsetPattern = /(?:srcset|data-srcset)=["']([^"']+)["']/gi;

  for (const match of body.matchAll(attrPattern)) {
    if (match[1]) urls.add(match[1]);
  }

  for (const match of body.matchAll(srcsetPattern)) {
    const entries = (match[1] ?? "").split(",");
    for (const entry of entries) {
      const candidate = entry.trim().split(/\s+/)[0];
      if (candidate) urls.add(candidate);
    }
  }

  return [...urls];
}

async function collectArticleImages(db: Firestore): Promise<PreparedArticleImage[]> {
  const snap = await db
    .collection("articles")
    .select("coverImage", "body", "slug")
    .get();
  const images = new Map<string, ArticleImageInfo>();

  for (const doc of snap.docs) {
    const slug = String(doc.get("slug") || doc.id);
    addImage(images, doc.get("coverImage"), doc.id, slug, "cover");

    const body = String(doc.get("body") || "");
    for (const url of extractBodyImageUrls(body)) {
      addImage(images, url, doc.id, slug, "embedded");
    }
  }

  const prepared = [...images.values()].map((info) => ({
    id: info.id,
    sourceUrl: info.sourceUrl,
    storagePath: info.storagePath,
    coverArticleIds: [...info.coverArticleIds],
    coverArticleSlugs: [...info.coverArticleSlugs],
    embeddedArticleIds: [...info.embeddedArticleIds],
    embeddedArticleSlugs: [...info.embeddedArticleSlugs],
  }));

  return LIMIT > 0 ? prepared.slice(0, LIMIT) : prepared;
}

async function collectMediaRefs(
  db: Firestore,
): Promise<Map<string, DocumentReference[]>> {
  const snap = await db.collection("media").select("url").get();
  const refs = new Map<string, DocumentReference[]>();

  for (const doc of snap.docs) {
    const sourceUrl = normalizeImageUrl(doc.get("url"));
    if (!sourceUrl) continue;
    const existing = refs.get(sourceUrl) ?? [];
    existing.push(doc.ref);
    refs.set(sourceUrl, existing);
  }

  return refs;
}

async function downloadImage(sourceUrl: string): Promise<DownloadedImage> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(sourceUrl, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "LeRelief-ArticleImageImporter/1.0",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        throw new Error(`Download failed ${res.status} ${res.statusText}`);
      }

      const contentType =
        res.headers.get("content-type") ?? contentTypeFromPath(sourceUrl);
      const fallbackContentType = contentTypeFromPath(sourceUrl);
      if (!contentType.startsWith("image/") && !fallbackContentType.startsWith("image/")) {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) throw new Error("Downloaded empty file");

      return {
        buffer,
        contentType: contentType.startsWith("image/")
          ? contentType
          : fallbackContentType,
        byteSize: buffer.length,
      };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function contentTypeFromPath(sourceUrl: string): string {
  const ext = path.extname(new URL(sourceUrl).pathname).toLowerCase();
  switch (ext) {
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}

function firebaseDownloadUrl(bucketName: string, storagePath: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath,
  )}?alt=media&token=${token}`;
}

function queueSet(
  operations: Array<(batch: WriteBatch) => void>,
  ref: DocumentReference,
  data: FirebaseFirestore.WithFieldValue<FirebaseFirestore.DocumentData>,
  options: FirebaseFirestore.SetOptions,
) {
  operations.push((batch) => batch.set(ref, data, options));
}

function queueUpdate(
  operations: Array<(batch: WriteBatch) => void>,
  ref: DocumentReference,
  data: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>,
) {
  operations.push((batch) => batch.update(ref, data));
}

async function commitOperations(
  db: Firestore,
  operations: Array<(batch: WriteBatch) => void>,
) {
  for (let i = 0; i < operations.length; i += 400) {
    const batch = db.batch();
    for (const operation of operations.slice(i, i + 400)) {
      operation(batch);
    }
    await batch.commit();
  }
}

async function uploadOne(
  db: Firestore,
  bucket: Bucket,
  mediaRefsByUrl: Map<string, DocumentReference[]>,
  image: PreparedArticleImage,
): Promise<UploadResult> {
  const imageRef = db.collection("article_images").doc(image.id);
  const existing = await imageRef.get();

  if (!FORCE && existing.exists && existing.get("status") === "uploaded") {
    return { status: "skipped", id: image.id, sourceUrl: image.sourceUrl };
  }

  try {
    const downloaded = await downloadImage(image.sourceUrl);
    const token = crypto.randomUUID();
    const downloadUrl = firebaseDownloadUrl(
      bucket.name,
      image.storagePath,
      token,
    );

    await bucket.file(image.storagePath).save(downloaded.buffer, {
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000",
        contentType: downloaded.contentType,
        metadata: {
          articleImageId: image.id,
          firebaseStorageDownloadTokens: token,
          sourceUrl: image.sourceUrl,
        },
      },
    });

    const storageInfo = {
      bucket: bucket.name,
      storagePath: image.storagePath,
      downloadUrl,
      contentType: downloaded.contentType,
      byteSize: downloaded.byteSize,
      sourceUrl: image.sourceUrl,
    };

    const operations: Array<(batch: WriteBatch) => void> = [];
    queueSet(
      operations,
      imageRef,
      {
        ...storageInfo,
        status: "uploaded",
        coverArticleIds: image.coverArticleIds,
        coverArticleSlugs: image.coverArticleSlugs,
        embeddedArticleIds: image.embeddedArticleIds,
        embeddedArticleSlugs: image.embeddedArticleSlugs,
        uploadedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    for (const mediaRef of mediaRefsByUrl.get(image.sourceUrl) ?? []) {
      queueUpdate(operations, mediaRef, {
        storageBucket: bucket.name,
        storagePath: image.storagePath,
        downloadUrl,
        downloadStatus: "uploaded",
        downloadedAt: FieldValue.serverTimestamp(),
      });
    }

    for (const articleId of image.coverArticleIds) {
      queueUpdate(operations, db.collection("articles").doc(articleId), {
        coverImageFirebaseUrl: downloadUrl,
        coverImageStorage: storageInfo,
        coverImageDownloadedAt: FieldValue.serverTimestamp(),
      });
    }

    await commitOperations(db, operations);

    return { status: "uploaded", id: image.id, sourceUrl: image.sourceUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await imageRef.set(
      {
        sourceUrl: image.sourceUrl,
        storagePath: image.storagePath,
        status: "failed",
        error: message,
        coverArticleIds: image.coverArticleIds,
        coverArticleSlugs: image.coverArticleSlugs,
        embeddedArticleIds: image.embeddedArticleIds,
        embeddedArticleSlugs: image.embeddedArticleSlugs,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      status: "failed",
      id: image.id,
      sourceUrl: image.sourceUrl,
      error: message,
    };
  }
}

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<UploadResult>,
): Promise<ImportStats> {
  const stats: ImportStats = { uploaded: 0, skipped: 0, failed: 0 };
  let index = 0;

  async function next() {
    while (index < items.length) {
      const current = index;
      index += 1;
      const result = await worker(items[current]!, current);
      stats[result.status] += 1;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => next()),
  );

  return stats;
}

async function main() {
  const { projectId } = initFirebase();
  const db = getFirestore();
  const bucket = await resolveBucket(projectId);

  console.log("Starting article image upload");
  console.log(`  bucket: ${bucket.name}`);
  console.log(`  concurrency: ${CONCURRENCY}`);
  if (LIMIT > 0) console.log(`  limit: ${LIMIT}`);
  if (FORCE) console.log("  force: enabled");

  const images = await collectArticleImages(db);
  const mediaRefsByUrl = await collectMediaRefs(db);
  console.log(`  article images to inspect: ${images.length}`);

  let completed = 0;
  const failures: UploadResult[] = [];

  const stats = await runWithConcurrency(images, async (image) => {
    const result = await uploadOne(db, bucket, mediaRefsByUrl, image);
    completed += 1;

    if (result.status === "failed") failures.push(result);

    if (completed === 1 || completed % 25 === 0 || completed === images.length) {
      console.log(
        `  progress ${completed}/${images.length}: ${result.status} ${image.sourceUrl}`,
      );
    }

    return result;
  });

  console.log("\nUpload complete");
  console.log(`  uploaded: ${stats.uploaded}`);
  console.log(`  skipped:  ${stats.skipped}`);
  console.log(`  failed:   ${stats.failed}`);

  if (failures.length > 0) {
    console.log("\nFirst failures:");
    for (const failure of failures.slice(0, 10)) {
      console.log(`  ${failure.sourceUrl}: ${failure.error}`);
    }
  }
}

main().catch((error) => {
  console.error("Fatal upload error:", error);
  process.exit(1);
});
