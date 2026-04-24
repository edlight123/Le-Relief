import type { PlatformSpec } from "./types.js";

export const TIKTOK: PlatformSpec = {
  id: "tiktok",
  label: "TikTok Vertical (9:16)",
  canvas: { width: 1080, height: 1920 },
  aspect: "9:16",
  safeArea: { top: 200, right: 90, bottom: 400, left: 90 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 2200, allowHashtags: true, allowEmoji: true },
  carousel: null,
  fileNamePrefix: "tiktok",
};
