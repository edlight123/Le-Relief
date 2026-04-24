import type { PlatformId } from "@le-relief/types";
import type { PlatformSpec } from "./types.js";
import { INSTAGRAM_FEED, INSTAGRAM_STORY, INSTAGRAM_REEL_COVER } from "./instagram.js";
import { FACEBOOK_FEED, FACEBOOK_LINK } from "./facebook.js";
import { X_LANDSCAPE, X_PORTRAIT } from "./x.js";
import { WHATSAPP_STATUS, WHATSAPP_STICKER } from "./whatsapp.js";
import { TIKTOK } from "./tiktok.js";
import { LINKEDIN_FEED, LINKEDIN_LINK } from "./linkedin.js";
import { THREADS } from "./threads.js";
import { YOUTUBE_SHORT_COVER } from "./youtube.js";

export const PLATFORM_SPECS: Record<PlatformId, PlatformSpec> = {
  "instagram-feed": INSTAGRAM_FEED,
  "instagram-story": INSTAGRAM_STORY,
  "instagram-reel-cover": INSTAGRAM_REEL_COVER,
  "facebook-feed": FACEBOOK_FEED,
  "facebook-link": FACEBOOK_LINK,
  "x-landscape": X_LANDSCAPE,
  "x-portrait": X_PORTRAIT,
  "whatsapp-status": WHATSAPP_STATUS,
  "whatsapp-sticker": WHATSAPP_STICKER,
  tiktok: TIKTOK,
  "linkedin-feed": LINKEDIN_FEED,
  "linkedin-link": LINKEDIN_LINK,
  threads: THREADS,
  "youtube-short-cover": YOUTUBE_SHORT_COVER,
};

export function getPlatformSpec(id: PlatformId): PlatformSpec {
  const spec = PLATFORM_SPECS[id];
  if (!spec) throw new Error(`[platforms] Unknown PlatformId: "${id}"`);
  return spec;
}

export function listPlatformIds(): PlatformId[] {
  return Object.keys(PLATFORM_SPECS) as PlatformId[];
}

export * from "./types.js";
export {
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
};
