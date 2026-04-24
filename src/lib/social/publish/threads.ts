/**
 * Threads API publisher — STUBBED. Threads uses the Meta Graph API
 * (separate `threads_basic`, `threads_content_publish` scopes from IG/FB).
 * Wire this once the `threads` connection record exists.
 */

import type { PlatformPostState, PublishResult } from "@/types/social";
import type { PublishContext } from "./index";
import { getConnection } from "../connections";

export async function publishToThreads(
  _state: PlatformPostState,
  _ctx: PublishContext,
): Promise<PublishResult> {
  const conn = await getConnection("threads");
  if (!conn || conn.status !== "connected") {
    return {
      status: "not-connected",
      mode: "api",
      error: "Threads n'est pas encore connecté.",
    };
  }
  return {
    status: "failed",
    mode: "api",
    error: "Threads publishing not implemented yet (adapter stubbed).",
  };
}
