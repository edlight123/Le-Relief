import { validateLocale, type Locale } from "@/lib/locale";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_CHANGE_EVENT = "le-relief-locale-change";
export const LOCALE_REQUEST_HEADER = "x-le-relief-locale";

export function getLocaleFromPathname(pathname: string | null | undefined): Locale | null {
  if (!pathname) return null;
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return validateLocale(firstSegment) ? firstSegment : null;
}

export function stripLocaleFromPathname(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  const suffixIndex = pathname.search(/[?#]/);
  const pathOnly = suffixIndex === -1 ? pathname : pathname.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : pathname.slice(suffixIndex);
  const segments = pathOnly.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && validateLocale(firstSegment)) {
    const cleanPath = `/${segments.slice(1).join("/")}`;
    return `${cleanPath === "/" ? "/" : cleanPath}${suffix}`;
  }

  return pathname || "/";
}

export function hrefForLocale(href: string, locale: Locale): string {
  if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(href)) return href;

  const cleanHref = stripLocaleFromPathname(href);
  if (cleanHref === "/") return `/${locale}`;
  return `/${locale}${cleanHref.startsWith("/") ? cleanHref : `/${cleanHref}`}`;
}

export function isActiveLocaleHref(pathname: string | null | undefined, href: string): boolean {
  const currentPath = stripLocaleFromPathname(pathname).split(/[?#]/)[0] || "/";
  const targetPath = stripLocaleFromPathname(href).split(/[?#]/)[0] || "/";
  return currentPath === targetPath;
}
