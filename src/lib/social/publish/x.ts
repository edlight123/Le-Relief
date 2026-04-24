/**
 * X (Twitter) — COPY-PASTE only in V1.
 *
 * Returns the caption + thread + asset URLs in a shape the admin UI
 * can render as a "ready to copy" card. The publisher then opens X
 * in a new tab, downloads the image, and posts manually.
 *
 * To switch to API publishing later: replace the body with a call to
 * https://api.twitter.com/2/tweets (media upload via v1.1 chunked upload),
 * keep the same return shape (just set `status: "published"` + ids).
 */

import type { PlatformId } from "@le-relief/types";
import type { PlatformPostState, PublishResult } from "@/types/social";
import type { PublishContext } from "./index";

export async function publishToX(
  platform: PlatformId,
  state: PlatformPostState,
  _ctx: PublishContext,
): Promise<PublishResult> {
  const lines = ["Texte prêt à coller dans X :", "", state.caption];
  if (state.thread && state.thread.length > 1) {
    lines.push("", "— Tweets suivants —", ...state.thread.slice(1).map((t, i) => `(${i + 2}/${state.thread!.length}) ${t}`));
  }
  lines.push("", "Téléchargez et joignez l'image ci-dessous.");
  return {
    status: "not-published",
    mode: "copy-paste",
    copyPaste: {
      caption: state.caption,
      thread: state.thread ?? undefined,
      assetUrls: state.assets.map((a) => a.url),
      instructions: lines.join("\n"),
    },
  };
}
