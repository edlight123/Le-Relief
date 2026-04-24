import type { PlatformSpec } from "./types.js";

export const FACEBOOK_FEED: PlatformSpec = {
  id: "facebook-feed",
  label: "Facebook Feed (4:5)",
  canvas: { width: 1200, height: 1500 },
  aspect: "4:5",
  safeArea: { top: 100, right: 100, bottom: 110, left: 100 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 63_206, allowHashtags: true, allowEmoji: true },
  carousel: { min: 1, max: 10 },
  fileNamePrefix: "fb-feed",
};

export const FACEBOOK_LINK: PlatformSpec = {
  id: "facebook-link",
  label: "Facebook Link Card (1.91:1)",
  canvas: { width: 1200, height: 630 },
  aspect: "1.91:1",
  safeArea: { top: 60, right: 80, bottom: 60, left: 80 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 63_206, allowHashtags: true, allowEmoji: true },
  carousel: null,
  fileNamePrefix: "fb-link",
};
