/**
 * TikTok publisher — STUBBED. TikTok Content Posting API requires app review.
 * V1 ships copy-paste fallback if no connection.
 */

import type { PlatformPostState, PublishResult } from "@/types/social";
import type { PublishContext } from "./index";
import { getConnection } from "../connections";

export async function publishToTikTok(
  state: PlatformPostState,
  _ctx: PublishContext,
): Promise<PublishResult> {
  const conn = await getConnection("tiktok");
  if (!conn || conn.status !== "connected") {
    return {
      status: "not-connected",
      mode: "api",
      error:
        "TikTok n'est pas encore connecté. En attendant, téléchargez l'image et publiez manuellement.",
      copyPaste: {
        caption: state.caption,
        assetUrls: state.assets.map((a) => a.url),
        instructions: "Téléchargez l'image, ouvrez TikTok → Créer → Photo, collez la légende.",
      },
    };
  }
  return {
    status: "failed",
    mode: "api",
    error: "TikTok publishing not implemented yet (adapter stubbed).",
  };
}
