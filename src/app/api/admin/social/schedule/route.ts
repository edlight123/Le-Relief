import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as socialRepo from "@/lib/repositories/social-posts";
import { logEvent } from "@/lib/social/audit";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { PlatformId } from "@le-relief/types";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

/**
 * Schedule (or unschedule) a per-platform publish.
 *   POST  { articleId, platform, scheduledFor }   → set
 *   POST  { articleId, platform, scheduledFor: null } → clear
 *
 * The scheduler worker (cron route) picks up `scheduled` rows whose
 * scheduledFor is in the past and dispatches them via /publish.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "publisher")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const articleId = body?.articleId as string | undefined;
  const platform = body?.platform as PlatformId | undefined;
  const scheduledFor = body?.scheduledFor as string | null | undefined;

  if (!articleId || !platform) {
    return NextResponse.json({ error: "articleId + platform required" }, { status: 400 });
  }

  const post = await socialRepo.getByArticleId(articleId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  const state = post.platforms[platform];
  if (!state) return NextResponse.json({ error: `Platform ${platform} not rendered` }, { status: 400 });

  if (scheduledFor) {
    const at = new Date(scheduledFor);
    if (Number.isNaN(at.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledFor" }, { status: 400 });
    }
    if (at.getTime() < Date.now() - 60_000) {
      return NextResponse.json({ error: "scheduledFor must be in the future" }, { status: 400 });
    }
    await socialRepo.updatePlatformPublishState(post.id, platform, {
      ...state.publish,
      status: "scheduled",
      scheduledFor: at.toISOString(),
      error: null,
    });
    await logEvent({
      postId: post.id,
      type: "schedule.set",
      actorId: (session.user.id as string) || "unknown",
      actorEmail: (session.user.email as string) || null,
      platform,
      message: `Scheduled for ${at.toISOString()}`,
      details: { scheduledFor: at.toISOString() },
    });
  } else {
    await socialRepo.updatePlatformPublishState(post.id, platform, {
      ...state.publish,
      status: "not-published",
      scheduledFor: null,
    });
    await logEvent({
      postId: post.id,
      type: "schedule.cleared",
      actorId: (session.user.id as string) || "unknown",
      actorEmail: (session.user.email as string) || null,
      platform,
    });
  }

  const fresh = await socialRepo.getById(post.id);
  return NextResponse.json({ post: fresh });
}
