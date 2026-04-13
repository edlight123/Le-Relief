import { NextRequest, NextResponse } from "next/server";
import * as mediaRepo from "@/lib/repositories/media";
import { auth } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await mediaRepo.getMediaItem(id);

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", media.url as string);
    await unlink(filePath);
  } catch {
    // file may not exist
  }

  await mediaRepo.deleteMedia(id);
  return NextResponse.json({ success: true });
}
