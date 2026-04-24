/**
 * WhatsApp — COPY-PASTE only in V1.
 *
 * Notes on WhatsApp publishing reality:
 *   - Status posts are NOT exposed by any official Meta API.
 *   - Cloud API only allows template messages to opted-in numbers.
 *   - Stickers cannot be auto-posted to Status either.
 * → V1 ships copy-paste, V2 may add a "broadcast template" flow when the
 *   newsroom builds a subscriber list.
 */

import type { PlatformId } from "@le-relief/types";
import type { PlatformPostState, PublishResult } from "@/types/social";
import type { PublishContext } from "./index";

export async function publishToWhatsApp(
  platform: PlatformId,
  state: PlatformPostState,
  _ctx: PublishContext,
): Promise<PublishResult> {
  const isSticker = platform === "whatsapp-sticker";
  const instructions = isSticker
    ? [
        "Sticker WhatsApp prêt :",
        "1. Téléchargez le fichier .webp ci-dessous (≤ 100 KB, transparent).",
        "2. Importez-le dans une application 'Sticker Maker' sur votre téléphone.",
        "3. Partagez sur WhatsApp depuis votre liste de stickers.",
      ].join("\n")
    : [
        "Statut WhatsApp prêt :",
        "1. Copiez le texte ci-dessous.",
        "2. Téléchargez l'image puis ouvrez WhatsApp → Statut → Nouveau statut.",
        "3. Sélectionnez l'image, collez le texte, publiez.",
      ].join("\n");

  return {
    status: "not-published",
    mode: "copy-paste",
    copyPaste: {
      caption: state.caption,
      assetUrls: state.assets.map((a) => a.url),
      instructions,
    },
  };
}
