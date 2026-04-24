/**
 * @le-relief/renderer
 *
 * Public entry point. Re-exports the engine API plus the multi-platform
 * convenience helpers (`renderForAllPlatforms`, `PlatformSpec`, adapters).
 */

// ── Browser ─────────────────────────────────────────────────────────────────
export { getBrowserInstance, closeBrowserInstance } from "./browser.js";

// ── Platforms ───────────────────────────────────────────────────────────────
export {
  PLATFORM_SPECS,
  getPlatformSpec,
  listPlatformIds,
  INSTAGRAM_FEED,
  INSTAGRAM_STORY,
  INSTAGRAM_REEL_COVER,
  FACEBOOK_FEED,
  FACEBOOK_LINK,
  X_LANDSCAPE,
  X_PORTRAIT,
  WHATSAPP_STATUS,
  WHATSAPP_STICKER,
  TIKTOK,
  LINKEDIN_FEED,
  LINKEDIN_LINK,
  THREADS,
  YOUTUBE_SHORT_COVER,
} from "./platforms/index.js";
export type { PlatformSpec, PlatformCaptionRules } from "./platforms/types.js";
export type { PlatformId } from "@le-relief/types";
export { wrapForPlatform } from "./platforms/wrapForPlatform.js";

// ── Engine (templates, pipeline, brand, adapters) ───────────────────────────
export * from "./engine/index.js";

// ── Multi-platform convenience API ──────────────────────────────────────────
export {
  renderForAllPlatforms,
  type RenderForAllPlatformsOptions,
  type RenderForAllPlatformsResult,
} from "./renderForAllPlatforms.js";
