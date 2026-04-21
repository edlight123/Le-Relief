import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateLocale } from "@/lib/locale";

const LOCALE_COOKIE = "NEXT_LOCALE";

function getPreferredLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && validateLocale(cookieLocale)) {
    return cookieLocale;
  }
  return "fr";
}

function withLocaleCookie(response: NextResponse, locale: "fr" | "en") {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return withLocaleCookie(NextResponse.redirect(url, 301), locale);
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && validateLocale(firstSegment)) {
    return withLocaleCookie(NextResponse.next(), firstSegment);
  }

  // Locale-like prefixes such as /es, /de should 404 instead of being auto-prefixed.
  if (firstSegment && /^[a-z]{2}$/i.test(firstSegment)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/fr${pathname}`;
  return withLocaleCookie(NextResponse.redirect(redirectUrl, 301), "fr");
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|dashboard).*)",
  ],
};
