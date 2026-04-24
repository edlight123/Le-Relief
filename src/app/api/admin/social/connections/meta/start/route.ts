/**
 * Meta OAuth — start step. Redirects the admin to Facebook's authorize URL.
 * Required env:
 *   META_APP_ID
 *   META_APP_SECRET           (used in the callback)
 *   NEXT_PUBLIC_SITE_URL      (so we can build the redirect_uri)
 */

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { hasRole, normalizeRole } from "@/lib/permissions";
import type { Role } from "@/types/user";

export const runtime = "nodejs";

const META_AUTH = "https://www.facebook.com/v20.0/dialog/oauth";
const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = normalizeRole((session.user as { role?: Role }).role ?? "writer");
  if (!hasRole(role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "META_APP_ID env not set" }, { status: 500 });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectUri = `${siteUrl}/api/admin/social/connections/meta/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  const url = new URL(META_AUTH);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 600,
    path: "/",
  });
  return res;
}
