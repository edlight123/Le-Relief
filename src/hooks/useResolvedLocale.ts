"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  LOCALE_CHANGE_EVENT,
  LOCALE_COOKIE,
  getLocaleFromPathname,
} from "@/lib/locale-routing";
import { validateLocale, type Locale } from "@/lib/locale";

function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value && validateLocale(value) ? value : null;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
    window.removeEventListener("focus", callback);
  };
}

export function notifyLocaleChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }
}

export function useResolvedLocale(fallbackLocale: Locale = "fr"): Locale {
  const pathname = usePathname();
  const cookieLocale = useSyncExternalStore(
    subscribe,
    () => readLocaleCookie() ?? fallbackLocale,
    () => fallbackLocale,
  );

  return getLocaleFromPathname(pathname) ?? cookieLocale;
}
