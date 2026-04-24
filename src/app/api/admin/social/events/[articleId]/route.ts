import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as socialRepo from "@/lib/repositories/social-posts";
import { listEvents } from "@/lib/social/audit";
import { hasRole, normalizeRole } from "@/lib/permissions";
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
  if (!post) return NextResponse.json({ events: [] });
  const events = await listEvents(post.id, 200);
  return NextResponse.json({ events });
}
