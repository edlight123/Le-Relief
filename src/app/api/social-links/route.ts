import { NextRequest, NextResponse } from "next/server";
import * as socialLinksRepo from "@/lib/repositories/social-links";
import { auth } from "@/lib/auth";

export async function GET() {
  const links = await socialLinksRepo.getSocialLinks();
  return NextResponse.json({ links });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  for (const [platform, url] of Object.entries(body)) {
    await socialLinksRepo.upsertSocialLink(platform, url as string);
  }

  const links = await socialLinksRepo.getSocialLinks();
  return NextResponse.json({ links });
}
