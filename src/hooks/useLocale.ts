"use client";

import { useEffect, useState, useCallback } from "react";

export type Locale = "fr" | "ht";

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const stored = localStorage.getItem("le-relief-locale") as Locale | null;
    if (stored && (stored === "fr" || stored === "ht")) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("le-relief-locale", l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "fr" ? "ht" : "fr");
  }, [locale, setLocale]);

  return { locale, setLocale, toggleLocale };
}
