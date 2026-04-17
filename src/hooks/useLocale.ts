"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Locale = "fr" | "ht";
const LOCALE_EVENT = "le-relief-locale-change";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const stored = localStorage.getItem("le-relief-locale") as Locale | null;
  return stored === "fr" || stored === "ht" ? stored : "fr";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getInitialLocale, () => "fr");

  useEffect(() => {
    localStorage.setItem("le-relief-locale", locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("le-relief-locale", l);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "fr" ? "ht" : "fr");
  }, [locale, setLocale]);

  return { locale, setLocale, toggleLocale };
}
