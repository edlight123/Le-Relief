import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as articlesRepo from "@/lib/repositories/articles";
import * as socialRepo from "@/lib/repositories/social-posts";
import { renderArticleSocialAssets } from "@/lib/social/render";
import { logEvent } from "@/lib/social/audit";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { PlatformId } from "@le-relief/types";
import type { Article } from "@/types/article";
import type { Role } from "@/types/user";

export const runtime = "nodejs";
export const maxDuration = 300;

const ALL_PLATFORMS: PlatformId[] = [
  "instagram-feed",
  "instagram-story",
  "instagram-reel-cover",
  "facebook-feed",
  "facebook-link",
  "x-landscape",
  "x-portrait",
  "whatsapp-status",
  "whatsapp-sticker",
  "tiktok",
  "linkedin-feed",
  "linkedin-link",
  "threads",
  "youtube-short-cover",
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "publisher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const articleId = body?.articleId as string | undefined;
  const platforms: PlatformId[] = Array.isArray(body?.platforms) && body.platforms.length > 0
    ? body.platforms
    : ALL_PLATFORMS;

  if (!articleId) {
    return NextResponse.json({ error: "articleId required" }, { status: 400 });
  }

  const article = (await articlesRepo.getArticle(articleId)) as Article | null;
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const actorId = (session.user.id as string) || "unknown";
  const actorEmail = (session.user.email as string) || null;

  try {
    const result = await renderArticleSocialAssets({ article, platforms });
    const post = await socialRepo.upsert({
      articleId: article.id,
      articleSlug: article.slug,
      articleTitle: article.title,
      articleLanguage: article.language,
      brandName: result.brandName,
      status: Object.keys(result.platforms).length === platforms.length ? "ready" : "partially_published",
      platforms: result.platforms,
      createdBy: actorId,
    });
    await logEvent({
      postId: post.id,
      type: "render.completed",
      actorId,
      actorEmail,
      message: `Rendered ${Object.keys(result.platforms).length} / ${platforms.length} platforms`,
      details: { platforms, warnings: result.warnings },
    });
    return NextResponse.json({ post, warnings: result.warnings });
  } catch (err) {
    console.error("[social/render] failed", err);
    return NextResponse.json(
      { error: "Render failed", detail: String(err) },
      { status: 500 },
    );
  }
}
