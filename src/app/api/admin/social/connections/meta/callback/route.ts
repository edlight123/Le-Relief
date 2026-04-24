/**
 * Meta OAuth — callback. Exchanges the code for a long-lived Page token,
 * discovers the FB Page id + linked IG Business user id, and stores them
 * via setConnection("meta").
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { setConnection } from "@/lib/social/connections";
import { logEvent } from "@/lib/social/audit";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

const GRAPH = "https://graph.facebook.com/v20.0";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expected = cookieStore.get("meta_oauth_state")?.value;
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  if (!state || state !== expected) {
    return NextResponse.json({ error: "Invalid state (CSRF)" }, { status: 400 });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (!appId || !appSecret) {
    return NextResponse.json({ error: "META_APP_ID / META_APP_SECRET not set" }, { status: 500 });
  }
  const redirectUri = `${siteUrl}/api/admin/social/connections/meta/callback`;

  // 1. Short-lived user token
  const tokRes = await fetch(
    `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
  );
  const tokJson = (await tokRes.json()) as { access_token?: string; error?: { message?: string } };
  if (!tokRes.ok || !tokJson.access_token) {
    return NextResponse.json({ error: tokJson.error?.message ?? "Token exchange failed" }, { status: 400 });
  }
  const shortToken = tokJson.access_token;

  // 2. Long-lived user token
  const longRes = await fetch(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`,
  );
  const longJson = (await longRes.json()) as { access_token?: string; expires_in?: number };
  const userToken = longJson.access_token ?? shortToken;
  const expiresAt = longJson.expires_in
    ? new Date(Date.now() + longJson.expires_in * 1000).toISOString()
    : null;

  // 3. Discover the first managed Page and its linked IG Business account.
  const pagesRes = await fetch(
    `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userToken)}`,
  );
  const pagesJson = (await pagesRes.json()) as {
    data?: Array<{
      id: string;
      name: string;
      access_token?: string;
      instagram_business_account?: { id: string };
    }>;
  };
  const page = pagesJson.data?.[0];
  if (!page) {
    return NextResponse.redirect(
      `${siteUrl}/admin/social/connections?error=${encodeURIComponent("Aucune Page Facebook trouvée pour cet utilisateur.")}`,
    );
  }

  const pageToken = page.access_token ?? userToken;
  const igUserId = page.instagram_business_account?.id ?? null;

  await setConnection({
    platform: "meta",
    token: pageToken,
    expiresAt,
    accountId: page.id,
    accountName: page.name,
    scopes: ["pages_manage_posts", "instagram_content_publish"],
    metadata: {
      fbPageId: page.id,
      ...(igUserId ? { igUserId } : {}),
    },
  });

  await logEvent({
    postId: "_global_",
    type: "connection.connected",
    actorId: (session.user.id as string) || "unknown",
    actorEmail: (session.user.email as string) || null,
    message: `Connected Meta → ${page.name}`,
    details: { fbPageId: page.id, igUserId, hasIg: !!igUserId },
  });

  const res = NextResponse.redirect(`${siteUrl}/admin/social/connections?connected=meta`);
  res.cookies.delete("meta_oauth_state");
  return res;
}
