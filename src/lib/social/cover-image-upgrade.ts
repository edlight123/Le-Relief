/**
 * Cover-image upgrade pipeline for social slides.
 *
 * Ports EdLight News's "find a high-res twin of the publisher image, then
 * vision-validate it" flow into Le Relief. Most of our `coverImage` URLs
 * come from WordPress imports and resolve to small (≤ 600 px) thumbnails
 * that look terrible blown up to 1080 × 1350 on Instagram. This module
 * tries to find the original high-resolution version of the *same* photo
 * and only swaps it in if Gemini Flash-Lite confirms the candidate
 * plausibly depicts the same subject as the article.
 *
 * Pipeline (zero-cost first, then progressively more expensive):
 *
 *   1. HEAD probe the existing coverImage. If it's already large enough
 *      (≥ MIN_TARGET_PX on the short side, by content-length heuristic
 *      ≥ 80 KB), keep it. No work, no API calls.
 *
 *   2. Google Cloud Vision WEB_DETECTION — pixel-anchored reverse search
 *      that returns the *exact same photo* hosted at higher resolution
 *      across the web (typically the original AP/Reuters/AFP/HPN file).
 *      Free quota: 1,000 calls/month, tracked in Firestore at
 *      `api_quotas/google_vision`.
 *
 *   3. SearXNG image search by article metadata — text-based fallback
 *      using title + author + entities to find the same news photo.
 *      SearXNG is a free, self-hostable metasearch frontend that
 *      aggregates Google Images / Bing / Qwant / DuckDuckGo etc., so we
 *      do not need a paid API key. Used only when Vision is unavailable
 *      or returns nothing.
 *
 *   4. Gemini Flash-Lite vision validation — a single multimodal call
 *      ($≈0.00006) that asks the model whether the candidate plausibly
 *      depicts the article subject. We only swap if it answers yes with
 *      confidence ≥ MIN_VALIDATION_CONFIDENCE.
 *
 * Failure mode is "soft pass": every step degrades to keeping the
 * publisher image. Nothing in the social-publishing flow blocks on this
 * module.
 *
 * Required env (each gates only its own tier — none are mandatory):
 *   - GOOGLE_VISION_API_KEY    Tier 2 (reverse image search)
 *   - SEARXNG_URL              Tier 3 (metadata fallback). Base URL of a
 *                              SearXNG instance with JSON output enabled,
 *                              e.g. "https://searx.example.org". Optional
 *                              `SEARXNG_AUTH_TOKEN` is sent as a Bearer
 *                              header for instances that require it.
 *   - GEMINI_API_KEY           Tier 4 (validation; without it we ACCEPT
 *                                       the candidate, since we have no
 *                                       way to second-guess the swap)
 */

import { Buffer } from "node:buffer";
import type { Article } from "@/types/article";
import { getDb } from "@/lib/firebase";

// ── Tunables ────────────────────────────────────────────────────────────────

/** Minimum short-side pixels we consider "good enough" for a 1080-wide slide. */
const MIN_TARGET_PX = 1080;
/** Below this content-length the publisher image is almost certainly a thumbnail. */
const SMALL_IMAGE_BYTES = 80_000;
/** Minimum Gemini vision confidence to accept a swap. */
const MIN_VALIDATION_CONFIDENCE = 0.55;
/** Hard cap for free-tier Google Vision (1,000) minus a 50-call safety buffer. */
const VISION_MONTHLY_CAP = 950;
/** Firestore path tracking Vision usage. */
const VISION_QUOTA_DOC = "api_quotas/google_vision";
/** Gemini model — same Flash-Lite tier EdLight uses. Cheap, fast, multimodal. */
const VISION_MODEL = "gemini-2.5-flash-lite";

const HEAD_TIMEOUT_MS = 5_000;
const VISION_TIMEOUT_MS = 15_000;
const SEARXNG_TIMEOUT_MS = 10_000;
const GEMINI_TIMEOUT_MS = 12_000;
const FETCH_TIMEOUT_MS = 8_000;

const STOCK_BLOCK =
  /getty|shutterstock|alamy|istockphoto|depositphotos|dreamstime|123rf/i;
const UA = "Le-Relief/1.0 (+https://lereliefhaiti.com)";

// ── Public API ──────────────────────────────────────────────────────────────

export interface UpgradeResult {
  /** Final image URL the renderer should use for slide 1. */
  imageUrl: string | null;
  /** Was the URL changed from the article's original `coverImage`? */
  upgraded: boolean;
  /** Which tier produced the final URL. */
  source:
    | "publisher"
    | "publisher-large-enough"
    | "vision-exact"
    | "vision-partial"
    | "vision-similar"
    | "searxng"
    | "rejected-by-vision"
    | "no-cover";
  /** Short human-readable explanation, surfaced in render warnings + logs. */
  reason: string;
}

/**
 * Best-effort cover-image upgrade. Never throws — every sub-step degrades
 * to returning the original `article.coverImage`.
 */
export async function upgradeCoverImage(article: Article): Promise<UpgradeResult> {
  const original = article.coverImage?.trim() || null;
  if (!original) {
    return {
      imageUrl: null,
      upgraded: false,
      source: "no-cover",
      reason: "Article has no coverImage.",
    };
  }

  // ── Step 1: quick HEAD probe — skip everything if already large ────────
  const isSmall = await isLikelySmall(original);
  if (!isSmall) {
    return {
      imageUrl: original,
      upgraded: false,
      source: "publisher-large-enough",
      reason: "Publisher image is already high-resolution.",
    };
  }

  // ── Step 2: Vision WEB_DETECTION — exact pixel-match search ────────────
  let candidate: { url: string; source: UpgradeResult["source"] } | null = null;
  try {
    const visionMatch = await findVisionMatch(original);
    if (visionMatch) {
      candidate = {
        url: visionMatch.url,
        source: visionMatch.matchType === "exact"
          ? "vision-exact"
          : visionMatch.matchType === "partial"
            ? "vision-partial"
            : "vision-similar",
      };
    }
  } catch (err) {
    console.warn(
      "[cover-image-upgrade] Vision step failed:",
      err instanceof Error ? err.message : err,
    );
  }

  // ── Step 3: SearXNG metadata fallback ──────────────────────────────────
  if (!candidate) {
    try {
      const searxUrl = await searchSearxngForArticleImage(article);
      if (searxUrl) candidate = { url: searxUrl, source: "searxng" };
    } catch (err) {
      console.warn(
        "[cover-image-upgrade] SearXNG step failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (!candidate) {
    return {
      imageUrl: original,
      upgraded: false,
      source: "publisher",
      reason: "No higher-resolution twin found; keeping publisher image.",
    };
  }

  // ── Step 4: Gemini vision validation ───────────────────────────────────
  // No GEMINI_API_KEY = soft pass (accept candidate, log a warning).
  const validation = await validateImageMatch(article, candidate.url);
  if (validation && (!validation.match || validation.confidence < MIN_VALIDATION_CONFIDENCE)) {
    console.log(
      `[cover-image-upgrade] candidate REJECTED by Gemini for article ${article.id}: ` +
        `match=${validation.match} confidence=${validation.confidence.toFixed(2)} ` +
        `— ${validation.reason}`,
    );
    return {
      imageUrl: original,
      upgraded: false,
      source: "rejected-by-vision",
      reason: `Vision rejected the upgrade candidate (${validation.reason || "no reason given"}).`,
    };
  }

  console.log(
    `[cover-image-upgrade] ✅ swapping cover for article ${article.id}: ` +
      `${candidate.source} → ${candidate.url.slice(0, 80)}${
        validation
          ? ` (vision OK, conf=${validation.confidence.toFixed(2)})`
          : " (no vision validator configured)"
      }`,
  );

  return {
    imageUrl: candidate.url,
    upgraded: true,
    source: candidate.source,
    reason:
      validation?.reason ||
      "Higher-resolution twin found; vision validator unavailable so accepted by default.",
  };
}

// ── Step 1 — size probe ─────────────────────────────────────────────────────

async function isLikelySmall(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
    });
    if (!res.ok) return true;
    const cl = parseInt(res.headers.get("content-length") ?? "0", 10);
    if (!cl) return true;
    return cl < SMALL_IMAGE_BYTES;
  } catch {
    return true;
  }
}

// ── Step 2 — Google Cloud Vision WEB_DETECTION ──────────────────────────────

interface VisionWebImage {
  url: string;
  score?: number;
}
interface VisionResponse {
  responses?: Array<{
    webDetection?: {
      fullMatchingImages?: VisionWebImage[];
      partialMatchingImages?: VisionWebImage[];
      visuallySimilarImages?: VisionWebImage[];
    };
  }>;
  error?: { message: string; code: number };
}

interface VisionMatch {
  url: string;
  matchType: "exact" | "partial" | "similar";
}

async function findVisionMatch(originalUrl: string): Promise<VisionMatch | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return null;

  const allowed = await tryConsumeVisionQuota();
  if (!allowed) return null;

  const body = {
    requests: [
      {
        image: { source: { imageUri: originalUrl } },
        features: [{ type: "WEB_DETECTION", maxResults: 20 }],
      },
    ],
  };

  let json: VisionResponse;
  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[cover-image-upgrade] Vision API ${res.status}: ${text.slice(0, 200)}`);
      return null;
    }
    json = (await res.json()) as VisionResponse;
  } catch (err) {
    console.warn(
      "[cover-image-upgrade] Vision request failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }

  if (json.error) {
    console.warn(
      `[cover-image-upgrade] Vision error ${json.error.code}: ${json.error.message}`,
    );
    return null;
  }

  const detection = json.responses?.[0]?.webDetection;
  if (!detection) return null;

  // Try exact → partial → similar in order, returning the first candidate
  // that (a) is not the original URL, (b) is not a stock CDN, and (c)
  // probes large enough to be useful.
  type Tier = { matchType: VisionMatch["matchType"]; urls: string[] };
  const tiers: Tier[] = [
    { matchType: "exact", urls: (detection.fullMatchingImages ?? []).map((i) => i.url) },
    { matchType: "partial", urls: (detection.partialMatchingImages ?? []).map((i) => i.url) },
    { matchType: "similar", urls: (detection.visuallySimilarImages ?? []).map((i) => i.url) },
  ];

  for (const tier of tiers) {
    for (const url of tier.urls) {
      if (!url || url === originalUrl) continue;
      if (STOCK_BLOCK.test(url)) continue;
      // Skip non-image extensions / SVG / PDF
      if (/\.(svg|pdf|tiff?)$/i.test(url)) continue;
      const big = await isLikelyLargeEnough(url);
      if (big) return { url, matchType: tier.matchType };
    }
  }

  return null;
}

async function isLikelyLargeEnough(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const cl = parseInt(res.headers.get("content-length") ?? "0", 10);
    return cl >= SMALL_IMAGE_BYTES;
  } catch {
    return false;
  }
}

// Vision monthly-quota guard — Firestore-backed, atomic.
async function tryConsumeVisionQuota(): Promise<boolean> {
  try {
    const db = getDb();
    const ref = db.doc(VISION_QUOTA_DOC);
    const month = new Date().toISOString().slice(0, 7);

    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists
        ? (snap.data() as { month?: string; count?: number } | undefined)
        : undefined;

      if (!snap.exists || data?.month !== month) {
        tx.set(ref, { month, count: 1, updatedAt: new Date() });
        return true;
      }
      const current = data?.count ?? 0;
      if (current >= VISION_MONTHLY_CAP) {
        console.warn(
          `[cover-image-upgrade] Vision quota exhausted ${current}/${VISION_MONTHLY_CAP} for ${month}`,
        );
        return false;
      }
      tx.update(ref, { count: current + 1, updatedAt: new Date() });
      return true;
    });
  } catch (err) {
    // Fail-open so a transient Firestore blip doesn't disable the swap
    // for everyone — at worst we overshoot the free tier by a handful.
    console.warn(
      "[cover-image-upgrade] Vision quota check failed (fail-open):",
      err instanceof Error ? err.message : err,
    );
    return true;
  }
}

// ── Step 3 — SearXNG image search (metadata fallback) ──────────────────────
//
// SearXNG returns a `results: SearxImageResult[]` array when called with
// `format=json` and `categories=images`. The fields we care about:
//   - `img_src`        full-resolution image URL
//   - `thumbnail_src`  smaller preview
//   - `resolution`     "1920x1080" string (sometimes missing)
//   - `source`/`engine` provider hint, used for stock-CDN blocking
//
// JSON output must be enabled on the instance (`search.formats: [json]`
// in `settings.yml`); some public instances disable it. If the fetch
// returns 4xx / non-JSON we degrade silently to keep the publisher image.

interface SearxImageResult {
  url?: string;
  title?: string;
  img_src?: string;
  thumbnail_src?: string;
  resolution?: string;
  source?: string;
  engine?: string;
}

function parseResolution(s: string | undefined): { w: number; h: number } | null {
  if (!s) return null;
  const m = s.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!m) return null;
  return { w: parseInt(m[1]!, 10), h: parseInt(m[2]!, 10) };
}

async function searchSearxngForArticleImage(article: Article): Promise<string | null> {
  const base = process.env.SEARXNG_URL?.trim();
  if (!base) return null;

  const query = buildSearchQuery(article);
  if (query.length < 5) return null;

  const url = new URL("/search", base.replace(/\/$/, "") + "/");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("categories", "images");
  url.searchParams.set("safesearch", "1");
  // Bias toward news-photography engines when supported by the instance.
  // SearXNG silently ignores unknown engines, so this is safe to set.
  url.searchParams.set("engines", "google images,bing images,qwant images,duckduckgo images");

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": UA,
  };
  const token = process.env.SEARXNG_AUTH_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  let data: { results?: SearxImageResult[] };
  try {
    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(SEARXNG_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(
        `[cover-image-upgrade] SearXNG returned ${res.status} for "${query}"`,
      );
      return null;
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!/json/i.test(ct)) {
      console.warn(
        `[cover-image-upgrade] SearXNG returned non-JSON (${ct}) — instance ` +
          `likely has JSON output disabled. Set \`search.formats: [json]\` in settings.yml.`,
      );
      return null;
    }
    data = (await res.json()) as { results?: SearxImageResult[] };
  } catch (err) {
    console.warn(
      "[cover-image-upgrade] SearXNG request failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }

  for (const img of data.results ?? []) {
    const candidate = img.img_src || img.thumbnail_src || null;
    if (!candidate) continue;
    if (/\.(svg|pdf|tiff?)$/i.test(candidate)) continue;

    // Block stock CDNs by domain (source URL or the image URL itself).
    const sourceDomain = (img.source ?? img.engine ?? "").toLowerCase();
    if (STOCK_BLOCK.test(sourceDomain) || STOCK_BLOCK.test(candidate)) continue;

    const dims = parseResolution(img.resolution);
    if (dims) {
      // When SearXNG reports dimensions, enforce the IG minimum.
      if (Math.min(dims.w, dims.h) < MIN_TARGET_PX) continue;
      return candidate;
    }

    // No reported dimensions → HEAD-probe to weed out thumbnails.
    const big = await isLikelyLargeEnough(candidate);
    if (big) return candidate;
  }
  return null;
}

const STOP_WORDS = new Set([
  // French
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "au",
  "aux", "pour", "par", "sur", "dans", "est", "sont", "été", "se",
  "ce", "qui", "que", "avec", "comme", "ses", "son", "sa",
  // English
  "the", "a", "an", "of", "in", "to", "for", "and", "is", "at", "on",
  "by", "with", "from", "has", "was", "are", "its", "it", "be", "as",
]);

function buildSearchQuery(article: Article): string {
  const parts: string[] = [];

  if (article.author?.name) parts.push(article.author.name);

  const titleWords = (article.title ?? "")
    .replace(/[''"""«»()\[\]{}]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 8);
  parts.push(...titleWords);

  if (article.category?.name) parts.push(article.category.name);

  // Dedupe while preserving order
  const seen = new Set<string>();
  return parts
    .filter((p) => {
      const k = p.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 14)
    .join(" ");
}

// ── Step 4 — Gemini Flash-Lite vision validation ────────────────────────────

export interface VisionValidation {
  match: boolean;
  confidence: number;
  reason: string;
}

async function validateImageMatch(
  article: Article,
  imageUrl: string,
): Promise<VisionValidation | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const inline = await fetchAsInlineData(imageUrl);
  if (!inline) return null;

  const prompt =
    "You verify whether a candidate news image plausibly depicts the subject of an article.\n" +
    "Reply ONLY with JSON: {\"match\": boolean, \"confidence\": number 0-1, \"reason\": short string}.\n" +
    "Be strict. Return match=false when ANY of the following is true:\n" +
    "  - The image is a generic stock photo, illustration, or icon.\n" +
    "  - The image is a website screenshot, logo, or banner.\n" +
    "  - The image clearly depicts a different person than any named subject.\n" +
    "  - The image depicts a clearly different event, place, or topic.\n" +
    "Return match=true when the depicted subject reasonably matches the article topic.\n\n" +
    `Article title: ${article.title ?? ""}\n` +
    `Subtitle: ${article.subtitle ?? ""}\n` +
    `Summary: ${(article.excerpt ?? "").slice(0, 300)}\n` +
    `Category: ${article.category?.name ?? ""}\n` +
    `Language: ${article.language === "en" ? "English" : "French"}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    VISION_MODEL,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: inline.mimeType, data: inline.data } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 128,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn(`[cover-image-upgrade] Gemini ${res.status}: ${txt.slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    const parsed = JSON.parse(text) as Partial<VisionValidation>;
    if (typeof parsed.match !== "boolean") return null;
    return {
      match: parsed.match,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0,
      reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : "",
    };
  } catch (err) {
    console.warn(
      "[cover-image-upgrade] Gemini validation failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function fetchAsInlineData(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 5_000_000) return null;
    const mimeType =
      res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    return { data: buf.toString("base64"), mimeType };
  } catch {
    return null;
  }
}
