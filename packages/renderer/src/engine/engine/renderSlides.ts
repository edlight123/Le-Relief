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

  const results: RenderedSlide[] = [];

  try {
    for (let i = 0; i < post.slides.length; i++) {
      const slide = post.slides[i]!;

      if (!slide.validation.fitPassed) {
        console.warn(
          `[renderSlides] slide ${i + 1}/${post.slides.length} failed fit check` +
            (slide.validation.overflowRisk ? " (overflow risk)" : "") +
            ` — rendering anyway (platform=${platform})`,
        );
      }

      const baseHtml = buildSlideHtml(
        post.templateId,
        slide,
        contentType,
        i,
        post.slides.length,
      );
      const html = wrapForPlatform(baseHtml, spec);

      const page = await context.newPage();
      try {
        await setContentWithFallback(page, html);

        const png = await takeScreenshot(page, spec);

        results.push({
          slideNumber: i + 1,
          png,
          widthPx: spec.canvas.width * scaleFactor,
          heightPx: spec.canvas.height * scaleFactor,
          format: spec.exportFormat,
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await context.close();
  }

  return results;
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
  try {
    await page.setContent(html, {
      waitUntil: "networkidle",
      timeout: NETWORK_IDLE_TIMEOUT_MS,
    });
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.message.includes("Timeout") || err.name === "TimeoutError");
    if (!isTimeout) throw err;
    console.warn(
      "[renderSlides] ⚠ networkidle timed out — falling back to immediate render",
    );
    await page.setContent(html, { waitUntil: "commit", timeout: 5_000 });
    await page.waitForTimeout(500);
  }
}

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
  if (spec.exportFormat === "jpeg") {
    const buf = await page.screenshot({
      type: "jpeg",
      quality: spec.exportQuality ?? 90,
      clip,
    });
    return Buffer.from(buf);
  }
  if (spec.exportFormat === "webp") {
    // playwright-core has no native WebP encoder. Capture PNG (with
    // transparency when required) and transcode via sharp.
    const pngBuf = await page.screenshot({
      type: "png",
      omitBackground: spec.background === "transparent",
      clip,
    });
    const startQuality = spec.exportQuality ?? 80;
    const isSticker = spec.canvas.width === 512 && spec.canvas.height === 512;
    const sizeCap = isSticker ? 100 * 1024 : Infinity;

    const encode = async (quality: number): Promise<Buffer> => {
      let pipeline = sharp(pngBuf);
      if (isSticker) {
        pipeline = pipeline.resize(512, 512, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
      }
      return pipeline.webp({ quality, effort: 6 }).toBuffer();
    };

    // Adaptive quality: start at spec.exportQuality, step down until under cap.
    let quality = startQuality;
    let webp = await encode(quality);
    while (webp.byteLength > sizeCap && quality > 30) {
      quality -= 10;
      webp = await encode(quality);
    }
    return webp;
  }
  const buf = await page.screenshot({
    type: "png",
    omitBackground: spec.background === "transparent",
    clip,
  });
  return Buffer.from(buf);
}
