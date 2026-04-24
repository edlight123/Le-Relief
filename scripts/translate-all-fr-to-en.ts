/**
 * Batch translate all published FR articles into EN drafts via Gemini.
 *
 * Flags:
 *   --limit=N            cap number of articles processed (default: all)
 *   --concurrency=N      parallel in-flight requests (default: 10)
 *   --dry-run            do not write any EN docs, just simulate
 *   --rps=N              soft rate cap (requests/second, default: 8)
 *   --skip-existing      skip FR articles that already have an EN translation (default: true)
 *   --resume             alias of --skip-existing
 *   --status=published   filter on FR status (default: published)
 *   --provider=gemini    override TRANSLATION_PROVIDER for this run (default: gemini)
 */
import { config as dotenvConfig } from "dotenv";
// Load .env first (working Firebase creds), then .env.local for any extra keys
// like GEMINI_API_KEY. dotenv does not override already-set vars.
dotenvConfig({ path: ".env" });
dotenvConfig({ path: ".env.local" });
// If .env.local set Firebase creds that don't decode, force-prefer .env values.
import { readFileSync, existsSync } from "node:fs";
function reloadFromDotEnv(file: string, keys: string[]) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const key of keys) {
    const m = text.match(new RegExp(`^${key}=(.*)$`, "m"));
    if (!m) continue;
    let v = m[1]!.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[key] = v;
  }
}
reloadFromDotEnv(".env", ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]);
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import { translateFrenchArticleToEnglish } from "../src/lib/ai/translation";
import { generateSlug } from "../src/lib/slug";
import type { ArticleContentType } from "../src/types/article";

// ---------- Firebase Admin bootstrap ----------
const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env
  .FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n")
  .replace(/^["']|["']$/g, "");

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}
const db = getFirestore();

// ---------- CLI args ----------
function flag(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (arg) return arg.split("=").slice(1).join("=");
  if (process.argv.includes(`--${name}`)) return "true";
  return undefined;
}

const LIMIT = Number(flag("limit") ?? "0") || Infinity;
const CONCURRENCY = Math.max(1, Number(flag("concurrency") ?? "10"));
const RPS = Math.max(1, Number(flag("rps") ?? "8"));
const DRY_RUN = flag("dry-run") === "true";
const SKIP_EXISTING =
  flag("skip-existing") !== "false" && flag("resume") !== "false";
const STATUS_FILTER = flag("status") ?? "published";
const PROVIDER = flag("provider") ?? "gemini";

// Force-set provider for this process unless caller already set one explicitly.
process.env.TRANSLATION_PROVIDER = PROVIDER;

// ---------- Types ----------
interface FrArticleDoc {
  id: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  body: string;
  slug: string;
  status: string;
  categoryId?: string | null;
  authorId?: string | null;
  contentType?: ArticleContentType | null;
  tags?: string[];
  coverImage?: string | null;
  coverImageCaption?: string | null;
  publishedAt?: unknown;
}

// ---------- Helpers ----------
async function fetchAllFrArticles(): Promise<FrArticleDoc[]> {
  const snap = await db
    .collection("articles")
    .where("status", "==", STATUS_FILTER)
    .get();
  const out: FrArticleDoc[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const lang = (data.language as string) || "fr";
    if (lang !== "fr") continue;
    out.push({ id: d.id, ...(data as object) } as FrArticleDoc);
  }
  return out;
}

async function fetchExistingEnSourceIds(): Promise<Set<string>> {
  const snap = await db
    .collection("articles")
    .where("language", "==", "en")
    .get();
  const out = new Set<string>();
  for (const d of snap.docs) {
    const src = (d.data() as Record<string, unknown>).sourceArticleId;
    if (typeof src === "string" && src.length > 0) out.add(src);
  }
  return out;
}

async function fetchCategoryName(id: string | null | undefined): Promise<string> {
  if (!id) return "General";
  const s = await db.collection("categories").doc(id).get();
  if (!s.exists) return "General";
  const name = (s.data() as Record<string, unknown>).name;
  return typeof name === "string" ? name : "General";
}

async function fetchAuthorName(id: string | null | undefined): Promise<string> {
  if (!id) return "Le Relief";
  const s = await db.collection("users").doc(id).get();
  if (!s.exists) return "Le Relief";
  const data = s.data() as Record<string, unknown>;
  const name =
    (typeof data.displayName === "string" && data.displayName) ||
    (typeof data.name === "string" && data.name) ||
    (typeof data.email === "string" && data.email) ||
    "Le Relief";
  return name as string;
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || "article";
  let i = 1;
  while (true) {
    const snap = await db
      .collection("articles")
      .where("slug", "==", candidate)
      .limit(1)
      .get();
    if (snap.empty) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
    if (i > 50) {
      candidate = `${base}-${Date.now()}`;
      return candidate;
    }
  }
}

// ---------- Rate limiter ----------
class RateLimiter {
  private interval: number;
  private next = 0;
  constructor(rps: number) {
    this.interval = 1000 / rps;
  }
  async acquire() {
    const now = Date.now();
    const wait = Math.max(0, this.next - now);
    this.next = Math.max(now, this.next) + this.interval;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
}

// ---------- Concurrency pool ----------
async function pool<T>(
  items: T[],
  worker: (item: T, idx: number) => Promise<void>,
  concurrency: number,
) {
  let cursor = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        await worker(items[idx]!, idx);
      } catch (err) {
        console.error(`[worker] item ${idx} crashed:`, err);
      }
    }
  });
  await Promise.all(runners);
}

// ---------- Main ----------
async function main() {
  console.log("Le Relief — bulk FR→EN translation");
  console.log({ LIMIT: Number.isFinite(LIMIT) ? LIMIT : "all", CONCURRENCY, RPS, DRY_RUN, SKIP_EXISTING, STATUS_FILTER, PROVIDER });

  if (!process.env.GEMINI_API_KEY && PROVIDER === "gemini") {
    throw new Error("GEMINI_API_KEY is missing in env.");
  }

  console.log("Loading articles…");
  const [allFr, existingSrcIds] = await Promise.all([
    fetchAllFrArticles(),
    SKIP_EXISTING ? fetchExistingEnSourceIds() : Promise.resolve(new Set<string>()),
  ]);
  console.log(`Found ${allFr.length} FR ${STATUS_FILTER} articles. EN already-translated: ${existingSrcIds.size}.`);

  const queue = allFr
    .filter((a) => !SKIP_EXISTING || !existingSrcIds.has(a.id))
    .filter((a) => typeof a.body === "string" && a.body.trim().length > 0)
    .slice(0, Number.isFinite(LIMIT) ? LIMIT : undefined);

  console.log(`Queued ${queue.length} articles for translation.`);
  if (queue.length === 0) return;

  // Cache category & author names to limit Firestore reads.
  const catCache = new Map<string, Promise<string>>();
  const authorCache = new Map<string, Promise<string>>();
  const getCat = (id: string | null | undefined) => {
    const key = id || "__none__";
    if (!catCache.has(key)) catCache.set(key, fetchCategoryName(id));
    return catCache.get(key)!;
  };
  const getAuthor = (id: string | null | undefined) => {
    const key = id || "__none__";
    if (!authorCache.has(key)) authorCache.set(key, fetchAuthorName(id));
    return authorCache.get(key)!;
  };

  const limiter = new RateLimiter(RPS);

  const startedAt = Date.now();
  let done = 0;
  let ok = 0;
  let failed = 0;
  const failures: Array<{ id: string; slug: string; error: string }> = [];

  await pool(
    queue,
    async (article, idx) => {
      const [categoryName, authorName] = await Promise.all([
        getCat(article.categoryId ?? null),
        getAuthor(article.authorId ?? null),
      ]);

      await limiter.acquire();

      try {
        const result = await translateFrenchArticleToEnglish({
          title: article.title,
          subtitle: article.subtitle ?? "",
          excerpt: article.excerpt ?? "",
          body: article.body,
          categoryName,
          contentType: (article.contentType as ArticleContentType) || "actualite",
          authorName,
          sourceSlug: article.slug,
        });

        if (DRY_RUN) {
          ok++;
          done++;
          if (done % 25 === 0 || done === queue.length) {
            const elapsed = (Date.now() - startedAt) / 1000;
            const rate = done / elapsed;
            const eta = (queue.length - done) / Math.max(rate, 0.001);
            console.log(
              `[${done}/${queue.length}] ok=${ok} fail=${failed} rate=${rate.toFixed(2)}/s eta=${Math.round(eta)}s`,
            );
          }
          return;
        }

        const baseSlug = generateSlug(result.titleEn || article.slug + "-en");
        const slugEn = await uniqueSlug(baseSlug);

        const ref = db.collection("articles").doc();
        const now = FieldValue.serverTimestamp();
        await ref.set({
          title: result.titleEn,
          subtitle: result.subtitleEn || null,
          excerpt: result.excerptEn || null,
          body: result.bodyEn,
          slug: slugEn,
          seoTitle: result.seoTitleEn || null,
          metaDescription: result.seoDescriptionEn || null,
          summary: result.summaryEn || null,
          coverImage: article.coverImage || null,
          coverImageCaption: article.coverImageCaption || null,
          tags: Array.isArray(article.tags) ? article.tags : [],
          categoryId: article.categoryId || null,
          authorId: article.authorId || null,
          contentType: article.contentType || "actualite",
          status: "draft",
          featured: false,
          isBreaking: false,
          isHomepagePinned: false,
          priorityLevel: null,
          language: "en",
          isCanonicalSource: false,
          translationStatus: "generated_draft",
          sourceArticleId: article.id,
          alternateLanguageSlug: article.slug,
          allowTranslation: false,
          translationPriority: null,
          translationProvider: result.provider,
          translationModel: result.model,
          translationPromptVersion: result.promptVersion,
          translatedAt: now,
          publishedAt: null,
          scheduledAt: null,
          views: 0,
          createdAt: now,
          updatedAt: now,
        });

        // Back-link the FR article to its EN translation slug (best-effort).
        try {
          await db
            .collection("articles")
            .doc(article.id)
            .update({ alternateLanguageSlug: slugEn, updatedAt: now });
        } catch {
          /* non-fatal */
        }

        ok++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        failures.push({ id: article.id, slug: article.slug, error: msg });
        if (failures.length <= 5) {
          console.error(`  ✗ ${article.slug} (${article.id}): ${msg.slice(0, 200)}`);
        }
      } finally {
        done++;
        if (done % 10 === 0 || done === queue.length) {
          const elapsed = (Date.now() - startedAt) / 1000;
          const rate = done / elapsed;
          const eta = (queue.length - done) / Math.max(rate, 0.001);
          console.log(
            `[${done}/${queue.length}] ok=${ok} fail=${failed} rate=${rate.toFixed(2)}/s eta=${Math.round(eta)}s (idx=${idx})`,
          );
        }
      }
    },
    CONCURRENCY,
  );

  const totalSec = (Date.now() - startedAt) / 1000;
  console.log("\n=== DONE ===");
  console.log({
    processed: done,
    succeeded: ok,
    failed,
    seconds: Math.round(totalSec),
    avgPerArticleSec: (totalSec / Math.max(done, 1)).toFixed(2),
  });

  if (failures.length > 0) {
    const fs = await import("node:fs/promises");
    const path = `translation-failures-${Date.now()}.json`;
    await fs.writeFile(path, JSON.stringify(failures, null, 2));
    console.log(`Wrote ${failures.length} failure records to ${path}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
