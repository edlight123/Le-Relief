/**
 * @le-relief/renderer – Multi-platform convenience API
 *
 * Drives the full pipeline once per requested {@link PlatformId} using a
 * single shared Chromium instance. For each platform it:
 *   1. runs the engine `buildPost` once (if a pre-built post isn't supplied),
 *   2. re-renders the slides for that platform's {@link PlatformSpec},
 *   3. exports slide files + `caption.txt` + `meta.json` into a per-platform
 *      subfolder of `outputDir`.
 *
 * Usage example — see `packages/renderer/README.md` and `scripts/smoke.ts`.
 */

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { PlatformId, SocialFormattedPayload } from "@le-relief/types";
import { buildPost, isExportReady, type BuildSlidesResult } from "./engine/engine/buildSlides.js";
import { renderPost } from "./engine/engine/renderSlides.js";
import { exportPost } from "./engine/engine/exportSlides.js";
import type { ContentIntakeInput, EnginePost, ExportResult, PostCaption, SlideContent } from "./engine/types/post.js";
import { getPlatformSpec } from "./platforms/index.js";
import { closeBrowserInstance } from "./browser.js";

export interface RenderForAllPlatformsOptions {
  platforms: PlatformId[];
  outputDir: string;
  /** Pre-built slide contents. If omitted, the engine builds them from intake. */
  rawSlides?: SlideContent[];
  /** Pre-built caption. If omitted, uses intake.sourceSummary. */
  caption?: PostCaption;
  /** Content type key for brand colour lookup (news / breaking / …). */
  contentType?: string;
  /** Optional legacy payload used for per-platform caption overrides. */
  payload?: SocialFormattedPayload;
  /** Close the shared Chromium at the end. Default: true. */
  closeBrowser?: boolean;
  /** Force export even when overflow warnings remain. */
  forceExport?: boolean;
  /** Optional override for the ISO date string used in file names. */
  dateOverride?: string;
  /** Article slug for human-readable export file names. */
  slug?: string;
}

export interface RenderForAllPlatformsResult {
  post: EnginePost;
  overflowWarnings: string[];
  exports: Partial<Record<PlatformId, ExportResult>>;
}

/**
 * Render a single intake for every platform in `options.platforms`, dropping
 * one subdirectory per platform under `options.outputDir`.
 */
export async function renderForAllPlatforms(
  intake: ContentIntakeInput,
  options: RenderForAllPlatformsOptions,
): Promise<RenderForAllPlatformsResult> {
  const {
    platforms,
    outputDir,
    rawSlides,
    caption,
    contentType = intake.category,
    payload,
    closeBrowser = true,
    forceExport = false,
    dateOverride,
    slug,
  } = options;

  mkdirSync(outputDir, { recursive: true });

  // ── Build post once (shared across all platforms) ──────────────────────────
  const effectiveRawSlides: SlideContent[] =
    rawSlides ??
    [
      {
        slideNumber: 1,
        headline: intake.topic,
        body: intake.sourceSummary,
        sourceLine: intake.sourceNote,
        layoutVariant: "cover",
      },
    ];

  const effectiveCaption: PostCaption =
    caption ?? {
      text: payload?.caption ?? intake.sourceSummary,
      hashtags: [],
    };

  const built: BuildSlidesResult = buildPost({
    intake,
    rawSlides: effectiveRawSlides,
    caption: effectiveCaption,
  });
  const { post, overflowWarnings } = built;

  const exports: Partial<Record<PlatformId, ExportResult>> = {};

  try {
    for (const platform of platforms) {
      const spec = getPlatformSpec(platform);
      const platformDir = join(outputDir, platform);
      mkdirSync(platformDir, { recursive: true });

      try {
        // Honor carousel caps: single-image platforms get only the first slide.
        const slidesForPlatform =
          spec.carousel === null
            ? { ...post, slides: post.slides.slice(0, 1) }
            : {
                ...post,
                slides: post.slides.slice(0, Math.min(post.slides.length, spec.carousel.max)),
              };

        const rendered = await renderPost(slidesForPlatform, contentType, platform);

        const exportResult = exportPost(slidesForPlatform, rendered, {
          outputDir: platformDir,
          platform,
          payload,
          forceExport: forceExport || !isExportReady(post),
          dateOverride,
          slug,
        });

        exports[platform] = exportResult;
      } catch (err) {
        exports[platform] = {
          postId: post.id,
          templateId: post.templateId,
          date: dateOverride ?? new Date().toISOString().slice(0, 10),
          slideFiles: [],
          captionFile: "",
          metadataFile: "",
          success: false,
          errors: [String(err)],
        };
      }
    }
  } finally {
    if (closeBrowser) await closeBrowserInstance();
  }

  return { post, overflowWarnings, exports };
}
