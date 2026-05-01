import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { validateLocale } from "@/lib/locale";
import { LOCALE_COOKIE, LOCALE_REQUEST_HEADER } from "@/lib/locale-routing";
import {
  canAccessRoleScopedRoute,
  isRoleScopedRoute,
  normalizeAppRole,
} from "@/lib/role-routing";
import {
  E2E_REQUEST_ROLE_HEADER,
  E2E_REQUEST_USER_ID_HEADER,
  E2E_ROLE_HEADER,
  resolveE2ERole,
} from "@/lib/e2e-role";

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

function withLocaleRequestHeader(request: NextRequest, locale: "fr" | "en") {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_REQUEST_HEADER, locale);
  return requestHeaders;
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
  const e2eRole = resolveE2ERole(request.headers.get(E2E_ROLE_HEADER));

  if (isRoleScopedRoute(pathname)) {
    if (pathname.startsWith("/admin/access-denied")) {
      if (e2eRole) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(E2E_REQUEST_ROLE_HEADER, e2eRole);
        requestHeaders.set(E2E_REQUEST_USER_ID_HEADER, `e2e-${e2eRole}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }

      return NextResponse.next();
    }

    if (e2eRole) {
      if (!canAccessRoleScopedRoute(pathname, e2eRole)) {
        return redirectToAccessDenied(request);
      }

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(E2E_REQUEST_ROLE_HEADER, e2eRole);
      requestHeaders.set(E2E_REQUEST_USER_ID_HEADER, `e2e-${e2eRole}`);
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    const secureCookie =
      request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      secureCookie,
      cookieName: secureCookie
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
    });
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
    // Rewrite to /{locale}/{rest} internally so the locale layout handles it
    // without stripping the locale prefix from the URL the user sees.
    // (A redirect here would lose the locale in the address bar and break EN links.)
    url.pathname = `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
    return withLocaleCookie(
      NextResponse.rewrite(url, {
        request: {
          headers: withLocaleRequestHeader(request, locale),
        },
      }),
      locale,
    );
  }

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return withLocaleCookie(
    NextResponse.rewrite(url, {
      request: {
        headers: withLocaleRequestHeader(request, locale),
      },
    }),
    locale,
  );
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
