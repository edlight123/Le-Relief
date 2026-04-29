import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as notificationsRepo from "@/lib/repositories/notifications";
import { getDb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // Polling from a layout shouldn't crash the dashboard if the session
      // expired between renders — return an empty payload with 401.
      return NextResponse.json(
        { notifications: [], unreadCount: 0, error: "Non autorisé" },
        { status: 401 },
      );
    }

    const notifications = await notificationsRepo.getUserNotifications(session.user.id);
    const unreadCount = notifications.filter(
      (n) => !(n as Record<string, unknown>).readAt,
    ).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    // Most common cause in production: missing Firestore composite index for
    // (userId asc, createdAt desc). The SDK throws a FAILED_PRECONDITION with
    // a link to create it. Surface a structured payload so the client doesn't
    // explode with `Unexpected end of JSON input`.
    console.error("[api/notifications] GET failed", err);
    return NextResponse.json(
      {
        notifications: [],
        unreadCount: 0,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    if (body.markAllRead) {
      await notificationsRepo.markAllAsRead(session.user.id);
      return NextResponse.json({ ok: true });
    }

    if (body.id) {
      // Verify the notification belongs to the authenticated user
      const notifDoc = await getDb().collection("notifications").doc(body.id).get();
      if (!notifDoc.exists || notifDoc.data()?.userId !== session.user.id) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      await notificationsRepo.markAsRead(body.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Paramètre manquant" }, { status: 400 });
  } catch (err) {
    console.error("[api/notifications] PATCH failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
