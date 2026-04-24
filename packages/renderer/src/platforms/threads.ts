import type { PlatformSpec } from "./types.js";

export const THREADS: PlatformSpec = {
  id: "threads",
  label: "Threads (4:5)",
  canvas: { width: 1080, height: 1350 },
  aspect: "4:5",
  safeArea: { top: 92, right: 90, bottom: 100, left: 90 },
  background: "solid",
  exportFormat: "png",
  caption: {
    maxChars: 500,
    allowHashtags: true,
    allowEmoji: true,
    splitIntoThread: true,
    threadChunkMaxChars: 500,
  },
  carousel: { min: 1, max: 10 },
  fileNamePrefix: "threads",
};
