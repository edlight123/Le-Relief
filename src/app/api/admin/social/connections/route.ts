import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listConnections, disconnect } from "@/lib/social/connections";
import { logEvent } from "@/lib/social/audit";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { ConnectionPlatform, SocialConnection } from "@/types/social";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

/** Strip the encrypted token before returning to the client. */
function safe(c: SocialConnection): Omit<SocialConnection, "encryptedToken"> {
  const { encryptedToken: _t, ...rest } = c;
  void _t;
  return rest;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conns = await listConnections();
  return NextResponse.json({ connections: conns.map(safe) });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const platform = body?.platform as ConnectionPlatform | undefined;
  if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });

  await disconnect(platform);
  await logEvent({
    postId: "_global_",
    type: "connection.disconnected",
    actorId: (session.user.id as string) || "unknown",
    actorEmail: (session.user.email as string) || null,
    message: `Disconnected ${platform}`,
  });
  return NextResponse.json({ ok: true });
}
