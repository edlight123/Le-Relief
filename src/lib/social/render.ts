/**
 * Render a Le Relief article into per-platform social assets and upload
 * the buffers to Firebase Storage. Returns a `PlatformPostState` map ready
 * to be persisted in Firestore via `social-posts` repository.
 *
 * Modes (controlled by env `RENDERER_MODE`):
 *   - "inline" (default)  →  in-process Playwright. Works locally + on a
 *                            Cloud Run worker. WILL NOT work on Vercel
 *                            because Playwright/Chromium exceeds the
 *                            serverless bundle limit.
 *   - "cloud-run"         →  HTTP POST to `RENDERER_URL` with JSON. The
 *                            remote worker runs the same renderer package
 *                            and returns base64-encoded buffers per slide.
 *
 * Both paths produce the same {@link RenderResult} shape.
 */

import crypto from "node:crypto";
import { getBucket } from "@/lib/firebase";
import type { PlatformId } from "@le-relief/types";
import type { Article } from "@/types/article";
import type { PlatformPostState, SocialAsset } from "@/types/social";
import { articleToSocialContent } from "./article-to-post";

export interface RenderInput {
  article: Article;
  platforms: PlatformId[];
}

export interface RenderResult {
  brandName: string;
  platforms: Partial<Record<PlatformId, PlatformPostState>>;
  warnings: string[];
}

export async function renderArticleSocialAssets(
  input: RenderInput,
): Promise<RenderResult> {
  const mode = process.env.RENDERER_MODE === "cloud-run" ? "cloud-run" : "inline";
  return mode === "cloud-run"
    ? renderViaCloudRun(input)
    : renderInline(input);
}

// ── Inline path (dev / Cloud Run worker) ────────────────────────────────────

async function renderInline(input: RenderInput): Promise<RenderResult> {
  // Fail fast with a useful message if Chromium isn't reachable. Inline
  // mode is only viable on a host that has Chromium installed (local dev,
  // Cloud Run with the worker image, GitHub Actions). On Vercel functions
  // it will not work — set RENDERER_MODE=cloud-run + RENDERER_URL there.
  await assertChromiumAvailable();

  // Dynamic import — the renderer package is heavy (Playwright, sharp) and
  // must not be bundled by Next. The serverExternalPackages list in
  // next.config.ts keeps it as a runtime require.
  const renderer = await import("@le-relief/renderer");
  const {
    buildPost,
    renderPost,
    getPlatformSpec,
    formatForPlatform,
    closeBrowserInstance,
    getBrand,
    setBrand,
    resetBrand,
  } = renderer;

  const { article, platforms } = input;

  // Per-language brand override. Wordmark + footer copy switch on EN.
  // Resets after the render so other concurrent calls aren't poisoned.
  resetBrand();
  if (article.language === "en") {
    // Cast: setBrand deep-merges partials, but BrandConfig.labels is typed
    // as a closed record so TS rejects a 2-key partial — runtime is fine.
    setBrand({
      labels: {
        sourceCredit: "Source",
        readMore: "Read on lereliefhaiti.com",
      },
    } as unknown as Parameters<typeof setBrand>[0]);
  }

  const { intake, rawSlides, caption, contentType } = articleToSocialContent(article);

  const built = buildPost({ intake, rawSlides, caption });
  const post = built.post;

  const brand = getBrand();
  const result: Partial<Record<PlatformId, PlatformPostState>> = {};
  const warnings: string[] = [...built.overflowWarnings];

  try {
    for (const platform of platforms) {
      const spec = getPlatformSpec(platform);
      const slidesForPlatform =
        spec.carousel === null
          ? { ...post, slides: post.slides.slice(0, 1) }
          : { ...post, slides: post.slides.slice(0, Math.min(post.slides.length, spec.carousel.max)) };

      try {
        const rendered = await renderPost(slidesForPlatform, contentType, platform);
        const adapted = formatForPlatform(platform, { post: slidesForPlatform });

        const assets: SocialAsset[] = [];
        for (const slide of rendered) {
          const asset = await uploadSlide({
            articleId: article.id,
            platform,
            slideNumber: slide.slideNumber,
            buffer: slide.png,
            format: slide.format,
            width: slide.widthPx,
            height: slide.heightPx,
          });
          assets.push(asset);
        }

        result[platform] = {
          assets,
          caption: adapted.caption,
          firstComment: adapted.firstComment ?? null,
          thread: adapted.thread ?? null,
          meta: (adapted.meta as Record<string, unknown>) ?? null,
          publish: { status: "not-published", mode: copyPasteOrApi(platform) },
          renderedAt: new Date().toISOString(),
          captionDirty: false,
        };
      } catch (err) {
        warnings.push(`${platform}: ${String(err)}`);
      }
    }
  } finally {
    await closeBrowserInstance();
    resetBrand();
  }

  return { brandName: brand.name, platforms: result, warnings };
}

// ── Cloud Run path ──────────────────────────────────────────────────────────

async function renderViaCloudRun(input: RenderInput): Promise<RenderResult> {
  const url = process.env.RENDERER_URL;
  if (!url) throw new Error("RENDERER_URL not configured");
  const bearer = process.env.RENDERER_AUTH_TOKEN;
  const audience = url.replace(/\/$/, "");

  // For private Cloud Run services we must present a Google-signed ID
  // token whose `aud` is the service URL. We mint it from the same
  // service-account credentials Firebase Admin already uses on Vercel.
  const idToken = await mintGoogleIdToken(audience).catch((err) => {
    console.warn("[renderer] could not mint Google ID token:", err);
    return null;
  });

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (idToken) {
    headers.authorization = `Bearer ${idToken}`;
    if (bearer) headers["x-renderer-token"] = bearer;
  } else if (bearer) {
    headers.authorization = `Bearer ${bearer}`;
  }

  // Cloud Run caps a single response body at ~32 MiB, AND the Vercel
  // function has a ~1 GiB memory ceiling. Aggregating ~14 platforms ×
  // 3 slides × ~5 MiB base64 in memory before uploading reliably OOMs
  // the function. Two-fold strategy:
  //   1. Chunk the request: 2 platforms per Cloud Run call (response cap).
  //   2. Stream uploads: as soon as a chunk lands, push every PNG to GCS
  //      and discard the base64 buffer. Never hold more than 1 chunk's
  //      worth of pixel data in memory.
  const CHUNK_SIZE = 2;
  const chunks: PlatformId[][] = [];
  for (let i = 0; i < input.platforms.length; i += CHUNK_SIZE) {
    chunks.push(input.platforms.slice(i, i + CHUNK_SIZE));
  }

  let brandName = "";
  const warnings: string[] = [];
  const platforms: Partial<Record<PlatformId, PlatformPostState>> = {};

  for (const chunk of chunks) {
    let res: Response;
    try {
      res = await fetch(`${audience}/render`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          article: input.article,
          platforms: chunk,
        }),
      });
    } catch (err) {
      warnings.push(`chunk ${chunk.join(",")}: fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    if (!res.ok) {
      warnings.push(
        `chunk ${chunk.join(",")}: Cloud Run renderer returned ${res.status}: ${(await res.text()).slice(0, 300)}`,
      );
      continue;
    }
    let json: {
      brandName: string;
      warnings: string[];
      platforms: Record<string, {
        slides: Array<{ slideNumber: number; pngBase64: string; format: "png" | "webp" | "jpeg"; width: number; height: number }>;
        caption: string;
        firstComment?: string | null;
        thread?: string[] | null;
        meta?: Record<string, unknown> | null;
      }>;
    };
    try {
      json = await res.json();
    } catch (err) {
      warnings.push(`chunk ${chunk.join(",")}: invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    if (!brandName) brandName = json.brandName;
    if (Array.isArray(json.warnings)) warnings.push(...json.warnings);

    // Upload immediately, then drop the base64 strings from memory before
    // the next chunk lands.
    for (const [platform, payload] of Object.entries(json.platforms) as [PlatformId, typeof json.platforms[string]][]) {
      try {
        const assets: SocialAsset[] = [];
        for (const slide of payload.slides) {
          const buffer = Buffer.from(slide.pngBase64, "base64");
          // Eagerly null out the base64 string so V8 can reclaim it.
          (slide as { pngBase64?: string }).pngBase64 = undefined;
          const asset = await uploadSlide({
            articleId: input.article.id,
            platform,
            slideNumber: slide.slideNumber,
            buffer,
            format: slide.format,
            width: slide.width,
            height: slide.height,
          });
          assets.push(asset);
        }
        platforms[platform] = {
          assets,
          caption: payload.caption,
          firstComment: payload.firstComment ?? null,
          thread: payload.thread ?? null,
          meta: payload.meta ?? null,
          publish: { status: "not-published", mode: copyPasteOrApi(platform) },
          renderedAt: new Date().toISOString(),
          captionDirty: false,
        };
      } catch (err) {
        warnings.push(`${platform}: upload failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    // Help GC by dropping reference to the chunk JSON before the next call.
    (json as unknown as { platforms?: unknown }).platforms = undefined;
  }

  return { brandName, platforms, warnings };
}

// ── Storage upload ──────────────────────────────────────────────────────────

interface UploadInput {
  articleId: string;
  platform: PlatformId;
  slideNumber: number;
  buffer: Buffer;
  format: "png" | "webp" | "jpeg";
  width: number;
  height: number;
}

async function uploadSlide(input: UploadInput): Promise<SocialAsset> {
  const bucket = getBucket();
  const hash = crypto.randomBytes(4).toString("hex");
  const filename = `slide-${String(input.slideNumber).padStart(2, "0")}-${hash}.${input.format}`;
  const storagePath = `social/${input.articleId}/${input.platform}/${filename}`;
  const file = bucket.file(storagePath);
  const contentType =
    input.format === "png"
      ? "image/png"
      : input.format === "jpeg"
        ? "image/jpeg"
        : "image/webp";

  await file.save(input.buffer, {
    contentType,
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  await file.makePublic().catch(() => {
    /* If uniform bucket-level access is on, makePublic throws — we still
       return a signed URL via getSignedUrl in that case. */
  });

  // Prefer a stable public URL; fall back to a long-lived signed URL.
  let url: string;
  try {
    url = `https://storage.googleapis.com/${bucket.name}/${encodeURI(storagePath)}`;
  } catch {
    const [signed] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
    });
    url = signed;
  }

  return {
    url,
    storagePath,
    format: input.format,
    width: input.width,
    height: input.height,
    sizeBytes: input.buffer.byteLength,
    slideNumber: input.slideNumber,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Mint a Google-signed ID token with `aud=audience` so we can invoke a
 * private Cloud Run service. Uses the same SA credentials Firebase Admin
 * already consumes on Vercel (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
 * or Application Default Credentials when present.
 *
 * Pure JWT-bearer flow — no extra dependency required beyond what
 * firebase-admin already pulls in (we sign locally and exchange at the
 * Google OAuth token endpoint).
 */
async function mintGoogleIdToken(audience: string): Promise<string | null> {
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

  // Prefer the base64-encoded service-account JSON when present — it round-
  // trips cleanly (no shell-escaping mishaps with the PEM newlines that
  // FIREBASE_PRIVATE_KEY frequently suffers on Vercel).
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try {
      const sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as {
        client_email?: string;
        private_key?: string;
      };
      if (sa.client_email) clientEmail = sa.client_email;
      if (sa.private_key) privateKey = sa.private_key;
    } catch {
      // fall back to discrete env vars
    }
  }

  if (!clientEmail || !privateKey) return null;
  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");
  // PEM parsers are picky about a trailing newline after -----END … -----
  if (!privateKey.endsWith("\n")) privateKey += "\n";

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    target_audience: audience,
  };
  const b64u = (b: Buffer | string) =>
    Buffer.from(b)
      .toString("base64")
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  const signingInput = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(claims))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const sig = signer.sign(privateKey);
  const assertion = `${signingInput}.${b64u(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`token exchange ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { id_token?: string };
  return json.id_token ?? null;
}

/** Which platforms publish via API vs copy-paste in V1. */
export function copyPasteOrApi(platform: PlatformId): "api" | "copy-paste" {
  // X + WhatsApp are intentionally copy-paste only per product decision.
  if (platform === "x-landscape" || platform === "x-portrait") return "copy-paste";
  if (platform === "whatsapp-status" || platform === "whatsapp-sticker") return "copy-paste";
  return "api";
}

/**
 * Probe for a Chromium binary before attempting to launch one. Throws a
 * human-readable error so the admin UI can surface a clear remediation
 * step instead of an opaque Playwright stack trace.
 */
async function assertChromiumAvailable(): Promise<void> {
  const fs = await import("node:fs/promises");
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean) as string[];

  for (const path of candidates) {
    try {
      await fs.access(path);
      return;
    } catch {
      // try next
    }
  }
  // Last resort: let playwright-core resolve its own bundled binary.
  // playwright-core is a transitive dep (via @le-relief/renderer) and is
  // not declared in the root package.json — type-erase the dynamic import
  // so the type checker doesn't try to resolve its declarations.
  try {
    const mod: { chromium: { executablePath(): string } } = await import(
      /* webpackIgnore: true */ "playwright-core" as string
    );
    const exe = mod.chromium.executablePath();
    if (exe) {
      try {
        await fs.access(exe);
        return;
      } catch {
        /* fall through */
      }
    }
  } catch {
    // playwright-core couldn't resolve — fall through to throw below
  }

  throw new Error(
    "Chromium not found. Set PLAYWRIGHT_CHROMIUM_PATH to a Chromium binary (e.g. /home/codespace/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome) " +
      "or run `npx playwright install chromium`. On Vercel, set RENDERER_MODE=cloud-run and RENDERER_URL instead.",
  );
}
