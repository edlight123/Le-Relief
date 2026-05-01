import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as socialRepo from "@/lib/repositories/social-posts";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { Role } from "@/types/user";
import type { SocialPostStatus } from "@/types/social";

export const runtime = "nodejs";

const VALID_TRANSITIONS: Partial<Record<SocialPostStatus, SocialPostStatus[]>> = {
  ready: ["needs_review", "approved"],
  needs_review: ["approved", "ready"],
  approved: ["needs_review", "ready"],
  failed: ["ready"],
};

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "publisher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { articleId, status } = body as { articleId?: string; status?: SocialPostStatus };

  if (!articleId || !status) {
    return NextResponse.json({ error: "articleId and status required" }, { status: 400 });
  }

  const post = await socialRepo.getByArticleId(articleId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[post.status] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Transition from '${post.status}' to '${status}' is not allowed` },
      { status: 422 },
    );
  }

  await socialRepo.updateStatus(post.id, status);
  const updated = await socialRepo.getById(post.id);
  return NextResponse.json({ post: updated });
}
