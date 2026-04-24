/**
 * @le-relief/renderer – Export Engine (platform-aware)
 *
 * Writes rendered slides + caption + metadata to disk for a single platform.
 *
 * Outputs (default):
 *   <outputDir>/<prefix>-slide-01.<ext>
 *   <outputDir>/caption.txt
 *   <outputDir>/meta.json
 *
 * Where `<prefix>` comes from `PlatformSpec.fileNamePrefix` and `<ext>` from
 * `PlatformSpec.exportFormat`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PlatformId, SocialFormattedPayload } from "@le-relief/types";
import type { EnginePost, ExportResult } from "../types/post.js";
import type { RenderedSlide } from "./renderSlides.js";
import { getPlatformSpec } from "../../platforms/index.js";
import { formatForPlatform } from "../adapters/index.js";
import { getBrand } from "../config/brand.js";

export interface ExportOptions {
  outputDir: string;
  platform?: PlatformId;
  /** Optional raw payload used for per-platform caption overrides. */
  payload?: SocialFormattedPayload;
  dateOverride?: string;
  forceExport?: boolean;
  includePreview?: boolean;
  previewBuffer?: Buffer;
}

export function exportPost(
  post: EnginePost,
  slides: RenderedSlide[],
  opts: ExportOptions,
): ExportResult {
  const {
    outputDir,
    platform = "instagram-feed",
    payload,
    dateOverride,
    forceExport = false,
    includePreview = false,
    previewBuffer,
  } = opts;

  const spec = getPlatformSpec(platform);
  const date = buildDateString(dateOverride);

  const hasUnresolved = post.slides.some(s => !s.validation.fitPassed);
  if (hasUnresolved && !forceExport) {
    return {
      postId: post.id,
      templateId: post.templateId,
      date,
      slideFiles: [],
      captionFile: "",
      metadataFile: "",
      success: false,
      errors: [
        "Export blocked: one or more slides have unresolved overflow. " +
          "Set forceExport: true to override.",
      ],
    };
  }

  mkdirSync(outputDir, { recursive: true });

  const prefix = `${spec.fileNamePrefix}-${post.templateId}-${date}`;
  const ext = spec.exportFormat;
  const errors: string[] = [];
  const slideFiles: string[] = [];

  // ── Slides ────────────────────────────────────────────────────────────────
  for (const rendered of slides) {
    const filename = `${prefix}-slide-${String(rendered.slideNumber).padStart(2, "0")}.${ext}`;
    const filepath = join(outputDir, filename);
    try {
      writeFileSync(filepath, rendered.png);
      if (platform === "whatsapp-sticker" && rendered.png.byteLength > 100 * 1024) {
        errors.push(
          `whatsapp-sticker slide ${rendered.slideNumber} exceeds 100 KB (${rendered.png.byteLength} B)`,
        );
      }
      slideFiles.push(filepath);
    } catch (err) {
      errors.push(`slide ${rendered.slideNumber}: ${String(err)}`);
    }
  }

  // ── Caption ───────────────────────────────────────────────────────────────
  const captionPath = join(outputDir, "caption.txt");
  const adapted = formatForPlatform(platform, { post, payload });
  try {
    const body = [adapted.caption];
    if (adapted.firstComment) body.push("", "--- first comment ---", adapted.firstComment);
    writeFileSync(captionPath, body.join("\n"), "utf8");
  } catch (err) {
    errors.push(`caption: ${String(err)}`);
  }

  // ── Metadata ──────────────────────────────────────────────────────────────
  const metaPath = join(outputDir, "meta.json");
  try {
    writeFileSync(
      metaPath,
      JSON.stringify(buildMetadata(post, date, platform, adapted.meta, adapted.thread), null, 2),
      "utf8",
    );
  } catch (err) {
    errors.push(`metadata: ${String(err)}`);
  }

  // ── Preview ───────────────────────────────────────────────────────────────
  let previewFile: string | undefined;
  if (includePreview && previewBuffer) {
    const previewPath = join(outputDir, `${prefix}-preview.png`);
    try {
      writeFileSync(previewPath, previewBuffer);
      previewFile = previewPath;
    } catch (err) {
      errors.push(`preview: ${String(err)}`);
    }
  }

  return {
    postId: post.id,
    templateId: post.templateId,
    date,
    slideFiles,
    captionFile: captionPath,
    metadataFile: metaPath,
    previewFile,
    success: errors.length === 0,
    errors,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDateString(override?: string): string {
  return override ?? new Date().toISOString().slice(0, 10);
}

interface ExportMeta {
  postId: string;
  brandName: string;
  platform: string;
  templateId: string;
  contentType: string;
  language: string;
  topic: string;
  date: string;
  slideCount: number;
  status: string;
  adapterMeta?: Record<string, unknown>;
  thread?: string[];
  fitSummary: {
    allPassed: boolean;
    slidesPassed: number;
    slidesFailed: number;
    overflowRiskCount: number;
    totalRewrites: number;
  };
  slides: Array<{
    slideNumber: number;
    headline: string;
    fitPassed: boolean;
    rewriteCount: number;
    overflowRisk: boolean;
    measuredLineCount: Record<string, number>;
    fontSizeUsed: Record<string, number>;
  }>;
}

function buildMetadata(
  post: EnginePost,
  date: string,
  platform: PlatformId,
  adapterMeta: Record<string, unknown> | undefined,
  thread: string[] | undefined,
): ExportMeta {
  const slidesPassed = post.slides.filter(s => s.validation.fitPassed).length;
  const totalRewrites = post.slides.reduce(
    (acc, s) => acc + s.validation.rewriteCount,
    0,
  );

  return {
    postId: post.id,
    brandName: getBrand().name,
    platform,
    templateId: post.templateId,
    contentType: post.contentType,
    language: post.language,
    topic: post.topic,
    date,
    slideCount: post.slides.length,
    status: post.status,
    adapterMeta,
    thread,
    fitSummary: {
      allPassed: slidesPassed === post.slides.length,
      slidesPassed,
      slidesFailed: post.slides.length - slidesPassed,
      overflowRiskCount: post.slides.filter(s => s.validation.overflowRisk).length,
      totalRewrites,
    },
    slides: post.slides.map((s, i) => ({
      slideNumber: i + 1,
      headline: s.headline,
      fitPassed: s.validation.fitPassed,
      rewriteCount: s.validation.rewriteCount,
      overflowRisk: s.validation.overflowRisk,
      measuredLineCount: s.validation.measuredLineCount,
      fontSizeUsed: s.validation.fontSizeUsed,
    })),
  };
}
