import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as socialRepo from "@/lib/repositories/social-posts";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { PlatformId } from "@le-relief/types";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ articleId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "publisher")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { articleId } = await ctx.params;
  const post = await socialRepo.getByArticleId(articleId);
  return NextResponse.json({ post });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ articleId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "publisher")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { articleId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const platform = body?.platform as PlatformId | undefined;
  const caption = body?.caption as string | undefined;

  if (!platform || typeof caption !== "string") {
    return NextResponse.json({ error: "platform + caption required" }, { status: 400 });
  }
  const post = await socialRepo.getByArticleId(articleId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await socialRepo.updatePlatformCaption(post.id, platform, caption);
  const fresh = await socialRepo.getById(post.id);
  return NextResponse.json({ post: fresh });
}
