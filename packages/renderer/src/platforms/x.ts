import type { PlatformSpec } from "./types.js";

export const X_LANDSCAPE: PlatformSpec = {
  id: "x-landscape",
  label: "X / Twitter Landscape (16:9)",
  canvas: { width: 1600, height: 900 },
  aspect: "16:9",
  safeArea: { top: 70, right: 90, bottom: 70, left: 90 },
  background: "solid",
  exportFormat: "png",
  caption: {
    maxChars: 280,
    allowHashtags: true,
    allowEmoji: true,
    splitIntoThread: true,
    threadChunkMaxChars: 280,
  },
  carousel: { min: 1, max: 4 },
  fileNamePrefix: "x-landscape",
};

export const X_PORTRAIT: PlatformSpec = {
  id: "x-portrait",
  label: "X / Twitter Portrait (4:5)",
  canvas: { width: 1080, height: 1350 },
  aspect: "4:5",
  safeArea: { top: 92, right: 90, bottom: 100, left: 90 },
  background: "solid",
  exportFormat: "png",
  caption: {
    maxChars: 280,
    allowHashtags: true,
    allowEmoji: true,
    splitIntoThread: true,
    threadChunkMaxChars: 280,
  },
  carousel: { min: 1, max: 4 },
  fileNamePrefix: "x-portrait",
};
