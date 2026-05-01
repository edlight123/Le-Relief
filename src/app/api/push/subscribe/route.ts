import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole, normalizeRole } from "@/lib/permissions";
import * as pushRepo from "@/lib/repositories/push-subscriptions";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

/**
 * GET /api/push/subscribe
 * Admin-only: returns total subscriber count.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const role = normalizeRole(((session.user as { role?: Role }).role) ?? "writer");
    if (!hasRole(role as Role, "admin")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const all = await pushRepo.getAllSubscriptions();
    const byLocale = all.reduce<Record<string, number>>((acc, s) => {
      const l = s.locale ?? "unknown";
      acc[l] = (acc[l] ?? 0) + 1;
      return acc;
    }, {});
    return NextResponse.json({ total: all.length, byLocale });
  } catch (err) {
    console.error("[api/push/subscribe] GET failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/push/subscribe
 * Body: { endpoint, keys: { p256dh, auth }, locale? }
 * Saves (or updates) the push subscription in Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys, locale } = body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
      locale?: string;
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
    }

    await pushRepo.saveSubscription({ endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, locale });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/push/subscribe] POST failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/push/subscribe
 * Body: { endpoint }
 * Removes the push subscription from Firestore.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = (await req.json()) as { endpoint?: string };
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }
    await pushRepo.deleteSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/push/subscribe] DELETE failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
