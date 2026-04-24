import type { PlatformSpec } from "./types.js";

export const YOUTUBE_SHORT_COVER: PlatformSpec = {
  id: "youtube-short-cover",
  label: "YouTube Short Cover (9:16)",
  canvas: { width: 1080, height: 1920 },
  aspect: "9:16",
  safeArea: { top: 200, right: 90, bottom: 360, left: 90 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 5000, allowHashtags: true, allowEmoji: true },
  carousel: null,
  fileNamePrefix: "yt-short-cover",
};
