/**
 * @le-relief/renderer – Layout Renderer (platform-aware)
 *
 * Renders validated slides to an image buffer using the shared Playwright
 * browser. Each template produces a canonical 1080×1350 body, which is then
 * wrapped by {@link wrapForPlatform} to fit the target {@link PlatformSpec}
 * (stories, stickers, landscape link cards, …).
 */

import sharp from "sharp";
import type { PlatformId } from "@le-relief/types";
import type { ValidatedSlide, EnginePost, TemplateId } from "../types/post.js";
import { buildSlideHtml } from "../templates/index.js";
import { getBrowserInstance } from "../../browser.js";
import { getPlatformSpec, type PlatformSpec } from "../../platforms/index.js";
import { wrapForPlatform } from "../../platforms/wrapForPlatform.js";

const NETWORK_IDLE_TIMEOUT_MS = 10_000;

/** Max pages to open in parallel within a single post render (tune for RAM). */
const MAX_PARALLEL_PAGES = 4;

// ── Public types ─────────────────────────────────────────────────────────────

export interface RenderedSlide {
  slideNumber: number;
  /** Encoded image buffer (PNG / WebP / JPEG depending on spec.exportFormat). */
  png: Buffer;
  widthPx: number;
  heightPx: number;
  format: "png" | "webp" | "jpeg";
}

export interface RenderOptions {
  /** Device scale factor for retina rendering. Default 2. */
  deviceScaleFactor?: 1 | 2;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Render all slides in a validated post for a specific platform.
 *
 * @param post        Fully validated EnginePost.
 * @param contentType Brand accent key (e.g. "news", "breaking").
 * @param platform    Target platform — defaults to "instagram-feed".
 */
export async function renderPost(
  post: EnginePost,
  contentType: string,
  platform: PlatformId = "instagram-feed",
  options?: RenderOptions,
): Promise<RenderedSlide[]> {
  if (post.status === "failed") {
    throw new Error(
      `[renderSlides] Cannot render post "${post.id}" — status is "failed".`,
    );
  }

  const spec = getPlatformSpec(platform);
  const scaleFactor = options?.deviceScaleFactor ?? 2;
  const browser = await getBrowserInstance();
  const context = await browser.newContext({
    viewport: { width: spec.canvas.width, height: spec.canvas.height },
    deviceScaleFactor: scaleFactor,
  });

  try {
    // Build all HTML strings first (CPU-only, no I/O)
    const slideJobs = post.slides.map((slide, i) => {
      if (!slide.validation.fitPassed) {
        console.warn(
          `[renderSlides] slide ${i + 1}/${post.slides.length} failed fit check` +
            (slide.validation.overflowRisk ? " (overflow risk)" : "") +
            ` — rendering anyway (platform=${platform})`,
        );
      }
      const baseHtml = buildSlideHtml(post.templateId, slide, contentType, i, post.slides.length);
      return { i, slide, html: wrapForPlatform(baseHtml, spec) };
    });

    // Render slides in parallel (up to MAX_PARALLEL_PAGES at a time)
    const ordered: (RenderedSlide | null)[] = new Array(slideJobs.length).fill(null);

    for (let batch = 0; batch < slideJobs.length; batch += MAX_PARALLEL_PAGES) {
      const chunk = slideJobs.slice(batch, batch + MAX_PARALLEL_PAGES);
      await Promise.all(
        chunk.map(async ({ i, html }) => {
          const page = await context.newPage();
          try {
            await setContentWithFallback(page, html);
            const png = await takeScreenshot(page, spec);
            ordered[i] = {
              slideNumber: i + 1,
              png,
              widthPx: spec.canvas.width,
              heightPx: spec.canvas.height,
              format: spec.exportFormat,
            };
          } finally {
            await page.close();
          }
        }),
      );
    }

    return ordered.filter((s): s is RenderedSlide => s !== null);
  } finally {
    await context.close();
  }
}

/** Render a single slide buffer for a specific platform. */
export async function renderSingleSlide(
  templateId: TemplateId,
  slide: ValidatedSlide,
  contentType: string,
  slideIndex: number,
  totalSlides: number,
  platform: PlatformId = "instagram-feed",
  options?: RenderOptions,
): Promise<Buffer> {
  const spec = getPlatformSpec(platform);
  const browser = await getBrowserInstance();
  const context = await browser.newContext({
    viewport: { width: spec.canvas.width, height: spec.canvas.height },
    deviceScaleFactor: options?.deviceScaleFactor ?? 2,
  });

  const page = await context.newPage();
  try {
    const baseHtml = buildSlideHtml(
      templateId,
      slide,
      contentType,
      slideIndex,
      totalSlides,
    );
    const html = wrapForPlatform(baseHtml, spec);
    await setContentWithFallback(page, html);
    return await takeScreenshot(page, spec);
  } finally {
    await page.close();
    await context.close();
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setContentWithFallback(
  page: import("playwright-core").Page,
  html: string,
): Promise<void> {
  // Fonts are inlined as base64 woff2 data URIs → no network requests.
  // "load" fires as soon as the DOM + inline resources are ready (~instant).
  try {
    await page.setContent(html, {
      waitUntil: "load",
      timeout: 8_000,
    });
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.message.includes("Timeout") || err.name === "TimeoutError");
    if (!isTimeout) throw err;
    console.warn(
      "[renderSlides] ⚠ load timed out — falling back to commit",
    );
    await page.setContent(html, { waitUntil: "commit", timeout: 5_000 });
    await page.waitForTimeout(200);
  }
}

/**
 * Take a high-quality screenshot and resize to the exact platform canvas size.
 *
 * Strategy — "retina-render then downscale":
 *   1. Playwright renders at deviceScaleFactor:2 → internal 2× resolution
 *      (e.g. 2160×2700 for a 1080×1350 Instagram feed post).
 *   2. sharp resizes back to spec.canvas dimensions (1080×1350) using the
 *      Lanczos3 kernel — the gold standard for downscaling text/graphics.
 *
 * Result: crisp 1080 px output with no aliasing, identical dimensions to what
 * the platform natively expects.
 */
async function takeScreenshot(
  page: import("playwright-core").Page,
  spec: PlatformSpec,
): Promise<Buffer> {
  const clip = {
    x: 0,
    y: 0,
    width: spec.canvas.width,
    height: spec.canvas.height,
  };

  /** Resize a raw PNG buffer to the exact spec canvas size. */
  const resizeToCanvas = (buf: Buffer): Promise<Buffer> =>
    sharp(buf)
      .resize(spec.canvas.width, spec.canvas.height, { kernel: "lanczos3" })
      .png({ compressionLevel: 1 })  // speed > file size for server-side buffers
      .toBuffer();

  if (spec.exportFormat === "jpeg") {
    const raw = await page.screenshot({ type: "png", clip });
    return sharp(Buffer.from(raw))
      .resize(spec.canvas.width, spec.canvas.height, { kernel: "lanczos3" })
      .jpeg({ quality: spec.exportQuality ?? 92, mozjpeg: true })
      .toBuffer();
  }

  if (spec.exportFormat === "webp") {
    // Capture at 2× via PNG, then transcode to WebP via sharp.
    const pngBuf = await page.screenshot({
      type: "png",
      omitBackground: spec.background === "transparent",
      clip,
    });
    const startQuality = spec.exportQuality ?? 80;
    const isSticker = spec.canvas.width === 512 && spec.canvas.height === 512;
    const sizeCap = isSticker ? 100 * 1024 : Infinity;

    const encode = async (quality: number): Promise<Buffer> => {
      let pipeline = sharp(pngBuf).resize(
        spec.canvas.width,
        spec.canvas.height,
        { kernel: "lanczos3", fit: isSticker ? "contain" : "fill", background: { r: 0, g: 0, b: 0, alpha: 0 } },
      );
      return pipeline.webp({ quality, effort: 6 }).toBuffer();
    };

    let quality = startQuality;
    let webp = await encode(quality);
    while (webp.byteLength > sizeCap && quality > 30) {
      quality -= 10;
      webp = await encode(quality);
    }
    return webp;
  }

  // PNG — capture at 2× then resize to exact 1080 px (or platform width)
  const raw = await page.screenshot({
    type: "png",
    omitBackground: spec.background === "transparent",
    clip,
  });
  return resizeToCanvas(Buffer.from(raw));
}
