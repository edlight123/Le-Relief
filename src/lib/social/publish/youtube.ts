/**
 * YouTube Short cover publisher — STUBBED. YouTube Data API v3 (`videos.insert`)
 * requires OAuth. V1 only renders a cover image (not a video), so the
 * realistic flow is: editor uses the cover as a thumbnail when uploading
 * the Short manually.
 */

import type { PlatformPostState, PublishResult } from "@/types/social";
import type { PublishContext } from "./index";
import { getConnection } from "../connections";

export async function publishToYouTube(
  state: PlatformPostState,
  _ctx: PublishContext,
): Promise<PublishResult> {
  const conn = await getConnection("youtube");
  if (!conn || conn.status !== "connected") {
    return {
      status: "not-connected",
      mode: "api",
      error:
        "YouTube n'est pas encore connecté. La couverture peut être utilisée comme miniature lors de la mise en ligne manuelle d'un Short.",
      copyPaste: {
        caption: state.caption,
        assetUrls: state.assets.map((a) => a.url),
        instructions: "Téléchargez la couverture comme miniature, puis téléversez votre vidéo Short manuellement.",
      },
    };
  }
  return {
    status: "failed",
    mode: "api",
    error: "YouTube publishing not implemented yet (adapter stubbed).",
  };
}
