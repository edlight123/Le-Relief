"use client";

import { createContext, useContext, useEffect } from "react";
import type { Locale } from "@/lib/locale";

const LocaleContext = createContext<Locale>("fr");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  return useContext(LocaleContext);
}
