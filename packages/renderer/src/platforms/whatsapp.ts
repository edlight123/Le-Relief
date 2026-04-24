import type { PlatformSpec } from "./types.js";

export const WHATSAPP_STATUS: PlatformSpec = {
  id: "whatsapp-status",
  label: "WhatsApp Status (9:16)",
  canvas: { width: 1080, height: 1920 },
  aspect: "9:16",
  safeArea: { top: 200, right: 90, bottom: 260, left: 90 },
  background: "solid",
  exportFormat: "jpeg",
  exportQuality: 88,
  caption: {
    maxChars: 700,
    allowHashtags: false, // no discovery surface on WhatsApp
    allowEmoji: true,
  },
  carousel: null,
  fileNamePrefix: "wa-status",
};

export const WHATSAPP_STICKER: PlatformSpec = {
  id: "whatsapp-sticker",
  label: "WhatsApp Sticker (1:1, transparent)",
  canvas: { width: 512, height: 512 },
  aspect: "1:1",
  safeArea: { top: 32, right: 32, bottom: 32, left: 32 },
  background: "transparent",
  exportFormat: "webp",
  exportQuality: 80,
  caption: { maxChars: 0, allowHashtags: false, allowEmoji: true },
  carousel: null,
  fileNamePrefix: "wa-sticker",
};
