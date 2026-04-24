/**
 * Audit log for social-publishing actions. Stored as a subcollection
 * `social_posts/{postId}/social_events`. Each event captures who did
 * what and when, plus any external API response. Critical for
 * accountability before turning on real publishing APIs.
 */

import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";
import type { PlatformId } from "@le-relief/types";

export type SocialEventType =
  | "render.started"
  | "render.completed"
  | "render.failed"
  | "caption.updated"
  | "publish.dispatched"
  | "publish.succeeded"
  | "publish.failed"
  | "publish.copy-paste-prepared"
  | "schedule.set"
  | "schedule.cleared"
  | "connection.connected"
  | "connection.disconnected";

export interface SocialEvent {
  id: string;
  type: SocialEventType;
  platform?: PlatformId | null;
  actorId: string;
  actorEmail?: string | null;
  message?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface LogInput {
  postId: string;
  type: SocialEventType;
  actorId: string;
  actorEmail?: string | null;
  platform?: PlatformId | null;
  message?: string | null;
  details?: Record<string, unknown> | null;
}

export async function logEvent(input: LogInput): Promise<void> {
  const ref = getDb()
    .collection("social_posts")
    .doc(input.postId)
    .collection("social_events")
    .doc();
  await ref.set({
    type: input.type,
    platform: input.platform ?? null,
    actorId: input.actorId,
    actorEmail: input.actorEmail ?? null,
    message: input.message ?? null,
    details: input.details ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function listEvents(postId: string, limit = 100): Promise<SocialEvent[]> {
  const snap = await getDb()
    .collection("social_posts")
    .doc(postId)
    .collection("social_events")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map(
    (d) =>
      serializeTimestamps({
        id: d.id,
        ...d.data(),
      } as unknown as Record<string, unknown>) as unknown as SocialEvent,
  );
}
