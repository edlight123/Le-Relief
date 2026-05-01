import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole, normalizeRole } from "@/lib/permissions";
import * as pushRepo from "@/lib/repositories/push-subscriptions";
import { sendPushToAll } from "@/lib/push";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

/**
 * POST /api/push/send
 * Admin-only: broadcast a push notification to all (or locale-filtered) subscribers.
 * Body: { title, body, url?, locale? }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const role = normalizeRole(((session.user as { role?: Role }).role) ?? "writer");
    if (!hasRole(role as Role, "admin")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { title, body, url, locale } = (await req.json()) as {
      title?: string;
      body?: string;
      url?: string;
      locale?: string;
    };

    if (!title || !body) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    const subscriptions = locale
      ? await pushRepo.getSubscriptionsByLocale(locale)
      : await pushRepo.getAllSubscriptions();

    const result = await sendPushToAll(
      subscriptions,
      { title, body, url: url || "/", icon: "/icon-192.png" },
      (endpoint) => pushRepo.deleteSubscription(endpoint),
    );

    return NextResponse.json({ ok: true, ...result, total: subscriptions.length });
  } catch (err) {
    console.error("[api/push/send] POST failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
