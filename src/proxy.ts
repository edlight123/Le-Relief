import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { validateLocale } from "@/lib/locale";
import {
  canAccessRoleScopedRoute,
  isRoleScopedRoute,
  normalizeAppRole,
} from "@/lib/role-routing";

export const LOCALE_COOKIE = "NEXT_LOCALE";
const DEFAULT_LOCALE = "fr";

function getPreferredLocale(request: NextRequest): "fr" | "en" {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && validateLocale(cookieLocale)) {
    return cookieLocale as "fr" | "en";
  }
  const acceptLang = request.headers.get("accept-language") || "";
  if (acceptLang.toLowerCase().startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

function withLocaleCookie(response: NextResponse, locale: "fr" | "en") {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

function redirectToAccessDenied(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/access-denied";
  return NextResponse.redirect(url);
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isRoleScopedRoute(pathname)) {
    if (pathname.startsWith("/admin/access-denied")) {
      return NextResponse.next();
    }

    const token = await getToken({ req: request });
    if (!token?.sub) {
      return redirectToLogin(request);
    }

    const role = normalizeAppRole(typeof token.role === "string" ? token.role : null);
    if (!role) {
      return redirectToAccessDenied(request);
    }

    if (!canAccessRoleScopedRoute(pathname, role)) {
      return redirectToAccessDenied(request);
    }

    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && validateLocale(firstSegment)) {
    const locale = firstSegment as "fr" | "en";
    const cleanPath = "/" + segments.slice(1).join("/");
    const url = request.nextUrl.clone();
    url.pathname = cleanPath || "/";
    return withLocaleCookie(NextResponse.redirect(url, 302), locale);
  }

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return withLocaleCookie(NextResponse.rewrite(url), locale);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
