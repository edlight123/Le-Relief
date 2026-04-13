import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const links = await db.socialLink.findMany();
  return NextResponse.json({ links });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  for (const [platform, url] of Object.entries(body)) {
    await db.socialLink.upsert({
      where: { platform },
      update: { url: url as string },
      create: { platform, url: url as string },
    });
  }

  const links = await db.socialLink.findMany();
  return NextResponse.json({ links });
}
