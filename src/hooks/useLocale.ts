"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Locale = "fr" | "en";
const LOCALE_EVENT = "le-relief-locale-change";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const stored = localStorage.getItem("le-relief-locale") as Locale | null;
  return stored === "fr" || stored === "en" ? stored : "fr";
}

function getServerSnapshot(): Locale {
  return "fr";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getInitialLocale, getServerSnapshot);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("le-relief-locale", locale);
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("le-relief-locale", l);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "fr" ? "en" : "fr");
  }, [locale, setLocale]);

  return { locale, setLocale, toggleLocale };
}
