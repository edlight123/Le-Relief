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

  // On Vercel the inline Playwright path cannot run — fail fast with a clear
  // remediation hint instead of a 300s timeout / opaque "Chromium not found".
  if (process.env.VERCEL && process.env.RENDERER_MODE !== "cloud-run") {
    return NextResponse.json(
      {
        error: "Renderer not configured",
        detail:
          "Set RENDERER_MODE=cloud-run and RENDERER_URL on this Vercel project. " +
          "Playwright/Chromium cannot run inside a Vercel function — the renderer " +
          "must be hosted on Cloud Run (see packages/renderer-server).",
      },
      { status: 503 },
    );
  }
  if (process.env.RENDERER_MODE === "cloud-run" && !process.env.RENDERER_URL) {
    return NextResponse.json(
      {
        error: "Renderer not configured",
        detail: "RENDERER_MODE=cloud-run is set but RENDERER_URL is missing.",
      },
      { status: 503 },
    );
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
    const renderedCount = Object.keys(result.platforms).length;

    // If nothing rendered, surface the underlying warnings rather than
    // silently writing an empty post — this is what was producing 200-with-
    // empty-platforms in production.
    if (renderedCount === 0) {
      console.error("[social/render] all platforms failed", { warnings: result.warnings });
      return NextResponse.json(
        {
          error: "Render failed for every platform",
          warnings: result.warnings,
        },
        { status: 502 },
      );
    }

    const status: "ready" | "partially_published" =
      renderedCount === platforms.length ? "ready" : "partially_published";

    const post = await socialRepo.upsert({
      articleId: article.id,
      articleSlug: article.slug,
      articleTitle: article.title,
      articleLanguage: article.language,
      brandName: result.brandName,
      status,
      platforms: result.platforms,
      createdBy: actorId,
    });
    await logEvent({
      postId: post.id,
      type: "render.completed",
      actorId,
      actorEmail,
      message: `Rendered ${renderedCount} / ${platforms.length} platforms`,
      details: { platforms, warnings: result.warnings },
    });
    return NextResponse.json({ post, warnings: result.warnings });
  } catch (err) {
    console.error("[social/render] failed", err);
    return NextResponse.json(
      {
        error: "Render failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
