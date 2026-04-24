/**
 * Publish dispatcher — routes a (PlatformPostState, PlatformId) pair to
 * the right platform adapter and returns a {@link PublishResult}.
 *
 * V1 status:
 *   - Instagram (feed/story/reel) + Facebook (feed/link)  → Meta Graph API (stub)
 *   - X (landscape/portrait)                              → COPY-PASTE
 *   - WhatsApp (status/sticker)                           → COPY-PASTE
 *   - Threads / LinkedIn / TikTok / YouTube Short         → API stubs
 *
 * Stubs return `{status: "not-connected"}` so the UI can show "Connect …"
 * without throwing. When credentials are added, swap the stub body for
 * the real Graph / API call — no other layer changes.
 */

import type { PlatformId } from "@le-relief/types";
import type {
  PlatformPostState,
  PublishResult,
} from "@/types/social";
import { publishToMeta } from "./meta";
import { publishToX } from "./x";
import { publishToWhatsApp } from "./whatsapp";
import { publishToThreads } from "./threads";
import { publishToLinkedIn } from "./linkedin";
import { publishToTikTok } from "./tiktok";
import { publishToYouTube } from "./youtube";

export interface PublishContext {
  articleTitle: string;
  articleUrl: string;
  language: "fr" | "en";
}

export async function dispatchPublish(
  platform: PlatformId,
  state: PlatformPostState,
  ctx: PublishContext,
): Promise<PublishResult> {
  switch (platform) {
    case "instagram-feed":
    case "instagram-story":
    case "instagram-reel-cover":
    case "facebook-feed":
    case "facebook-link":
      return publishToMeta(platform, state, ctx);
    case "x-landscape":
    case "x-portrait":
      return publishToX(platform, state, ctx);
    case "whatsapp-status":
    case "whatsapp-sticker":
      return publishToWhatsApp(platform, state, ctx);
    case "threads":
      return publishToThreads(state, ctx);
    case "linkedin-feed":
    case "linkedin-link":
      return publishToLinkedIn(platform, state, ctx);
    case "tiktok":
      return publishToTikTok(state, ctx);
    case "youtube-short-cover":
      return publishToYouTube(state, ctx);
    default: {
      const exhaustive: never = platform;
      throw new Error(`Unknown platform: ${exhaustive as string}`);
    }
  }
}

export type { PublishResult };
