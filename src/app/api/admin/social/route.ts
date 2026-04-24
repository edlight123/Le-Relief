import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as socialRepo from "@/lib/repositories/social-posts";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "publisher")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await socialRepo.listRecent(100);
  return NextResponse.json({ posts });
}
