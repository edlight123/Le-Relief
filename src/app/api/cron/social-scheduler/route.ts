/**
 * Scheduler — fires scheduled platform publishes whose `scheduledFor` is
 * in the past. Triggered by Vercel Cron (vercel.json) or any external
 * scheduler hitting this URL with the secret.
 *
 * Vercel cron config (already wired in vercel.json):
 *   { "path": "/api/cron/social-scheduler", "schedule": "* * * * *" }
 *
 * Auth: Vercel sends `authorization: Bearer ${CRON_SECRET}` automatically
 * when CRON_SECRET is set.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import * as socialRepo from "@/lib/repositories/social-posts";
import { dispatchPublish } from "@/lib/social/publish";
import { logEvent } from "@/lib/social/audit";
import type { PlatformId } from "@le-relief/types";
import type { PlatformPostState, SocialPost } from "@/types/social";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lereliefhaiti.com";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date().toISOString();
  // We can't query nested map fields efficiently in Firestore.
  // Strategy: fetch recent active posts, filter in memory. Volume is low
  // (newsroom-scale: dozens/day), so this is fine.
  const snap = await getDb()
    .collection("social_posts")
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();

  const dispatched: Array<{ articleId: string; platform: PlatformId; result: string }> = [];

  for (const doc of snap.docs) {
    const post = { id: doc.id, ...(doc.data() as Omit<SocialPost, "id">) };
    for (const [platform, state] of Object.entries(post.platforms ?? {}) as [
      PlatformId,
      PlatformPostState,
    ][]) {
      const sched = state.publish?.scheduledFor;
      if (state.publish?.status !== "scheduled" || !sched) continue;
      if (sched > now) continue;

      // Mark publishing first to avoid double-fire if cron overlaps.
      await socialRepo.updatePlatformPublishState(post.id, platform, {
        ...state.publish,
        status: "publishing",
      });

      const articleUrl = `${SITE_URL}${post.articleLanguage === "en" ? "/en" : ""}/articles/${post.articleSlug}`;
      try {
        const result = await dispatchPublish(platform, state, {
          articleTitle: post.articleTitle,
          articleUrl,
          language: post.articleLanguage,
        });
        await socialRepo.updatePlatformPublishState(post.id, platform, {
          mode: result.mode,
          status: result.status,
          publishedAt: result.status === "published" ? new Date().toISOString() : null,
          externalId: result.externalId ?? null,
          externalUrl: result.externalUrl ?? null,
          error: result.error ?? null,
          scheduledFor: null,
        });
        await logEvent({
          postId: post.id,
          type: result.status === "published" ? "publish.succeeded" : "publish.failed",
          actorId: "scheduler",
          platform,
          message: result.error ?? `Scheduled publish dispatched (${result.status})`,
          details: { externalId: result.externalId, externalUrl: result.externalUrl },
        });
        dispatched.push({ articleId: post.articleId, platform, result: result.status });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await socialRepo.updatePlatformPublishState(post.id, platform, {
          ...state.publish,
          status: "failed",
          error: message,
          scheduledFor: null,
        });
        await logEvent({
          postId: post.id,
          type: "publish.failed",
          actorId: "scheduler",
          platform,
          message,
        });
        dispatched.push({ articleId: post.articleId, platform, result: "failed" });
      }
    }
  }

  return NextResponse.json({ ok: true, dispatched, at: now });
}
