/**
 * LinkedIn publisher — STUBBED. LinkedIn requires the "Community Management
 * API" product (manual approval, ~weeks). Wire once approved.
 */

import type { PlatformId } from "@le-relief/types";
import type { PlatformPostState, PublishResult } from "@/types/social";
import type { PublishContext } from "./index";
import { getConnection } from "../connections";

export async function publishToLinkedIn(
  _platform: PlatformId,
  _state: PlatformPostState,
  _ctx: PublishContext,
): Promise<PublishResult> {
  const conn = await getConnection("linkedin");
  if (!conn || conn.status !== "connected") {
    return {
      status: "not-connected",
      mode: "api",
      error: "LinkedIn n'est pas encore connecté.",
    };
  }
  return {
    status: "failed",
    mode: "api",
    error: "LinkedIn publishing not implemented yet (adapter stubbed).",
  };
}
