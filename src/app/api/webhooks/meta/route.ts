/**
 * Meta webhooks — IG mention/comment/story_insights and FB feed updates.
 * Subscription verification (GET) + event delivery (POST).
 *
 * Required env:
 *   META_WEBHOOK_VERIFY_TOKEN   (any random string; configured in the Meta dashboard)
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  // V1: log only. Future: update social_posts.publish.status from
  // delivery callbacks once we tag posts with their Meta media id.
  const body = await req.json().catch(() => null);
  console.log("[meta-webhook] event", JSON.stringify(body));
  return NextResponse.json({ received: true });
}
