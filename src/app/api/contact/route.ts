import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Message reçu" });
}
