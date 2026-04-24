import type { PlatformSpec } from "./types.js";

export const LINKEDIN_FEED: PlatformSpec = {
  id: "linkedin-feed",
  label: "LinkedIn Feed (4:5)",
  canvas: { width: 1200, height: 1500 },
  aspect: "4:5",
  safeArea: { top: 100, right: 100, bottom: 110, left: 100 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 3000, allowHashtags: true, allowEmoji: true },
  carousel: { min: 1, max: 20 },
  fileNamePrefix: "linkedin-feed",
};

export const LINKEDIN_LINK: PlatformSpec = {
  id: "linkedin-link",
  label: "LinkedIn Link Card (1.91:1)",
  canvas: { width: 1200, height: 627 },
  aspect: "1.91:1",
  safeArea: { top: 60, right: 80, bottom: 60, left: 80 },
  background: "solid",
  exportFormat: "png",
  caption: { maxChars: 3000, allowHashtags: true, allowEmoji: true },
  carousel: null,
  fileNamePrefix: "linkedin-link",
};
