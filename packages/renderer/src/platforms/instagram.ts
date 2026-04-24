import type { PlatformSpec } from "./types.js";

export const INSTAGRAM_FEED: PlatformSpec = {
  id: "instagram-feed",
  label: "Instagram Feed (4:5)",
  canvas: { width: 1080, height: 1350 },
  aspect: "4:5",
  safeArea: { top: 92, right: 90, bottom: 100, left: 90 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 2200, allowHashtags: true, allowEmoji: true },
  carousel: { min: 1, max: 10 },
  fileNamePrefix: "ig-feed",
};

export const INSTAGRAM_STORY: PlatformSpec = {
  id: "instagram-story",
  label: "Instagram Story (9:16)",
  canvas: { width: 1080, height: 1920 },
  aspect: "9:16",
  safeArea: { top: 250, right: 90, bottom: 250, left: 90 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 2200, allowHashtags: true, allowEmoji: true },
  carousel: { min: 1, max: 6 },
  fileNamePrefix: "ig-story",
};

export const INSTAGRAM_REEL_COVER: PlatformSpec = {
  id: "instagram-reel-cover",
  label: "Instagram Reel Cover (9:16)",
  canvas: { width: 1080, height: 1920 },
  aspect: "9:16",
  safeArea: { top: 200, right: 90, bottom: 400, left: 90 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 2200, allowHashtags: true, allowEmoji: true },
  carousel: null,
  fileNamePrefix: "ig-reel-cover",
};
