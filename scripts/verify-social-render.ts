import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, "\n");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile("/tmp/.env.vercel.fresh");
loadEnvFile(path.resolve("/workspaces/Le-Relief/.env.local"));

process.env.RENDERER_MODE = process.env.RENDERER_URL?.trim() ? "cloud-run" : "inline";

async function main() {

const [{ upgradeCoverImage }, { articleToSocialContent }, { renderArticleSocialAssets }, { getBucket, getDb }, renderer] = await Promise.all([
  import("@/lib/social/cover-image-upgrade"),
  import("@/lib/social/article-to-post"),
  import("@/lib/social/render"),
  import("@/lib/firebase"),
  import("@le-relief/renderer"),
]);

const db = getDb();
const bucket = getBucket();

type LooseDoc = Record<string, unknown>;

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe.toDate === "function") return maybe.toDate();
  }
  return null;
}

async function headContentLength(url: string): Promise<number> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return 0;
    return parseInt(res.headers.get("content-length") ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

const snap = await db
  .collection("articles")
  .where("status", "==", "published")
  .limit(200)
  .get();

if (snap.empty) {
  throw new Error("No published articles found.");
}

let chosen: (LooseDoc & { id: string }) | null = null;
let chosenBytes = 0;
let foundLowResCandidate = false;
for (const doc of snap.docs) {
  const data = doc.data() as LooseDoc;
  if (typeof data.coverImage === "string" && data.coverImage.trim()) {
    const bytes = await headContentLength(data.coverImage);
    // Prefer likely low-quality covers to exercise the upgrade path.
    if (bytes > 0 && bytes < 80_000) {
      chosen = { id: doc.id, ...data };
      chosenBytes = bytes;
      foundLowResCandidate = true;
      break;
    }
    // Keep the first valid fallback in case none are low-res.
    if (!chosen) {
      chosen = { id: doc.id, ...data };
      chosenBytes = bytes;
    }
  }
}

if (!chosen) {
  chosen = { id: snap.docs[0]!.id, ...(snap.docs[0]!.data() as LooseDoc) };
  if (typeof chosen.coverImage === "string" && chosen.coverImage.trim()) {
    chosenBytes = await headContentLength(chosen.coverImage);
  }
}

const article = {
  id: chosen.id,
  title: chosen.title ?? "Untitled",
  subtitle: chosen.subtitle ?? null,
  slug: chosen.slug ?? `article-${chosen.id}`,
  body: chosen.body ?? "",
  excerpt: chosen.excerpt ?? null,
  seoTitle: chosen.seoTitle ?? null,
  metaDescription: chosen.metaDescription ?? null,
  canonicalUrl: chosen.canonicalUrl ?? null,
  coverImage: chosen.coverImage ?? null,
  status: chosen.status ?? "published",
  featured: !!chosen.featured,
  priorityLevel: chosen.priorityLevel ?? null,
  isBreaking: !!chosen.isBreaking,
  isHomepagePinned: !!chosen.isHomepagePinned,
  views: Number(chosen.views ?? 0),
  publishedAt: asDate(chosen.publishedAt),
  createdAt: asDate(chosen.createdAt) ?? new Date(),
  updatedAt: asDate(chosen.updatedAt) ?? new Date(),
  authorId: chosen.authorId ?? "",
  categoryId: chosen.categoryId ?? null,
  contentType: chosen.contentType ?? "actualite",
  alternateLanguageSlug: chosen.alternateLanguageSlug ?? null,
  allowTranslation: !!chosen.allowTranslation,
  translationPriority: chosen.translationPriority ?? null,
  submittedForReviewAt: asDate(chosen.submittedForReviewAt),
  approvedBy: chosen.approvedBy ?? null,
  approvedAt: asDate(chosen.approvedAt),
  publishedBy: chosen.publishedBy ?? null,
  revisionRequestedBy: chosen.revisionRequestedBy ?? null,
  revisionRequestedAt: asDate(chosen.revisionRequestedAt),
  rejectedBy: chosen.rejectedBy ?? null,
  rejectedAt: asDate(chosen.rejectedAt),
  language: chosen.language === "en" ? "en" : "fr",
  isCanonicalSource: chosen.language === "en" ? false : true,
  sourceArticleId: chosen.language === "en" ? chosen.sourceArticleId ?? "" : null,
  translationStatus: chosen.language === "en" ? (chosen.translationStatus ?? "not_started") : "not_applicable",
  author: chosen.author ?? undefined,
  category: chosen.category ?? undefined,
  tags: Array.isArray(chosen.tags) ? chosen.tags : undefined,
} as unknown as import("@/types/article").Article;

console.log("[verify] article:", article.id, "—", article.title?.slice(0, 80));
console.log("[verify] renderer mode:", process.env.RENDERER_MODE);
console.log("[verify] low-res candidate found:", foundLowResCandidate);
console.log("[verify] original cover:", article.coverImage ? String(article.coverImage).slice(0, 120) : "<none>");
if (article.coverImage) {
  console.log("[verify] original cover bytes (HEAD):", chosenBytes || "unknown");
}

const upgrade = await upgradeCoverImage(article);
console.log("[verify] upgrade:", upgrade);

const articleForRender = { ...article, coverImage: upgrade.imageUrl ?? article.coverImage };
const social = articleToSocialContent(articleForRender);
console.log("[verify] slide1 image:", social.rawSlides[0]?.imageUrl ? String(social.rawSlides[0].imageUrl).slice(0, 120) : "<none>");

const render = await renderArticleSocialAssets({
  article,
  platforms: ["instagram-feed"],
});

console.log("[verify] warnings:", render.warnings);
const ig = render.platforms["instagram-feed"];

if (ig?.assets?.length) {
  console.log("[verify] rendered assets:", ig.assets.length);
  console.log("[verify] first asset:", {
    url: ig.assets[0]?.url,
    width: ig.assets[0]?.width,
    height: ig.assets[0]?.height,
    sizeBytes: ig.assets[0]?.sizeBytes,
  });

  // Cleanup uploaded test assets
  for (const a of ig.assets) {
    if (!a?.storagePath) continue;
    await bucket.file(a.storagePath).delete().catch(() => undefined);
  }
  console.log("[verify] cleanup: done");
} else {
  console.log("[verify] social upload path did not produce assets; running direct renderer check...");
  const { buildPost, renderPost, closeBrowserInstance } = renderer;
  const built = buildPost({
    intake: social.intake,
    rawSlides: social.rawSlides,
    caption: social.caption,
  });
  const rendered = await renderPost(built.post, social.contentType, "instagram-feed");
  console.log("[verify] direct-render slide count:", rendered.length);
  console.log("[verify] direct-render first slide:", {
    slideNumber: rendered[0]?.slideNumber,
    width: rendered[0]?.widthPx,
    height: rendered[0]?.heightPx,
    bytes: rendered[0]?.png?.byteLength,
  });
  await closeBrowserInstance();
}
}

main().catch((err) => {
  console.error("[verify] failed:", err);
  process.exit(1);
});
