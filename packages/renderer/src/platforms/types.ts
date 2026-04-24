/**
 * @le-relief/renderer – Platform spec type
 *
 * A `PlatformSpec` is the authoritative source of every per-platform detail
 * the renderer needs: canvas dimensions, safe margins, file naming, caption
 * rules, and output format.
 */

import type { PlatformId } from "@le-relief/types";

export interface PlatformCaptionRules {
  /** Hard character limit enforced by the platform. */
  maxChars: number;
  allowHashtags: boolean;
  allowEmoji: boolean;
  /** When true, the adapter splits the caption into ≤ maxChars chunks. */
  splitIntoThread?: boolean;
  /** Per-thread-chunk char limit (defaults to maxChars when omitted). */
  threadChunkMaxChars?: number;
}

export interface PlatformSpec {
  id: PlatformId;
  label: string;
  canvas: { width: number; height: number };
  /** Aspect ratio as "W:H" (informational only). */
  aspect: string;
  safeArea: { top: number; right: number; bottom: number; left: number };
  background: "solid" | "transparent";
  exportFormat: "png" | "webp" | "jpeg";
  exportQuality?: number;
  caption: PlatformCaptionRules;
  /**
   * Carousel constraints. `null` means single-image only (e.g. link cards,
   * stories, stickers). `{min:2,max:10}` means the platform supports 2–10
   * slides.
   */
  carousel: { min: number; max: number } | null;
  /** Filename prefix used when exporting (e.g. "ig-feed", "fb-link"). */
  fileNamePrefix: string;
}

export type { PlatformId };
