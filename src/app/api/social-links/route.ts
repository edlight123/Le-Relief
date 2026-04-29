import { NextRequest, NextResponse } from "next/server";
import * as socialLinksRepo from "@/lib/repositories/social-links";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";

export async function GET() {
  const links = await socialLinksRepo.getSocialLinks();
  return NextResponse.json({ links });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sessionRole = ((session.user as { role?: string }).role || "writer").toString();
  if (!hasRole(sessionRole as import("@/types/user").Role, "admin")) {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = await req.json();

  for (const [platform, url] of Object.entries(body)) {
    await socialLinksRepo.upsertSocialLink(platform, url as string);
  }

  const links = await socialLinksRepo.getSocialLinks();
  return NextResponse.json({ links });
}
