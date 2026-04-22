import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as notificationsRepo from "@/lib/repositories/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const notifications = await notificationsRepo.getUserNotifications(session.user.id);
  const unreadCount = notifications.filter((n) => !(n as Record<string, unknown>).readAt).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
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
    await notificationsRepo.markAsRead(body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Paramètre manquant" }, { status: 400 });
}
