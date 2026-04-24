import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as socialRepo from "@/lib/repositories/social-posts";
import { dispatchPublish } from "@/lib/social/publish";
import { logEvent } from "@/lib/social/audit";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { PlatformId } from "@le-relief/types";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lereliefhaiti.com";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "publisher")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const articleId = body?.articleId as string | undefined;
  const platform = body?.platform as PlatformId | undefined;
  if (!articleId || !platform) {
    return NextResponse.json({ error: "articleId + platform required" }, { status: 400 });
  }

  const post = await socialRepo.getByArticleId(articleId);
  if (!post) return NextResponse.json({ error: "No render exists; run /render first" }, { status: 404 });

  const state = post.platforms[platform];
  if (!state) return NextResponse.json({ error: `Platform ${platform} not rendered` }, { status: 400 });

  const articleUrl = `${SITE_URL}${post.articleLanguage === "en" ? "/en" : ""}/articles/${post.articleSlug}`;

  // Optimistically mark as publishing for API-mode, then dispatch.
  if (state.publish.mode === "api") {
    await socialRepo.updatePlatformPublishState(post.id, platform, {
      ...state.publish,
      status: "publishing",
    });
  }

  const result = await dispatchPublish(platform, state, {
    articleTitle: post.articleTitle,
    articleUrl,
    language: post.articleLanguage,
  });

  await socialRepo.updatePlatformPublishState(post.id, platform, {
    mode: result.mode,
    status: result.status,
    publishedAt: result.status === "published" ? new Date().toISOString() : state.publish.publishedAt ?? null,
    externalId: result.externalId ?? null,
    externalUrl: result.externalUrl ?? null,
    error: result.error ?? null,
  });

  await logEvent({
    postId: post.id,
    type:
      result.status === "published"
        ? "publish.succeeded"
        : result.copyPaste
          ? "publish.copy-paste-prepared"
          : result.error
            ? "publish.failed"
            : "publish.dispatched",
    actorId: (session.user.id as string) || "unknown",
    actorEmail: (session.user.email as string) || null,
    platform,
    message: result.error ?? null,
    details: {
      mode: result.mode,
      status: result.status,
      externalId: result.externalId ?? null,
      externalUrl: result.externalUrl ?? null,
    },
  });

  return NextResponse.json({ result });
}
