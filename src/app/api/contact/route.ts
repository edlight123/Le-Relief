import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Contact form handler - for now just acknowledge
  // In production, integrate with email service
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Message received" });
}
