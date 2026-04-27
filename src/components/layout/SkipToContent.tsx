"use client";

import { useResolvedLocale } from "@/hooks/useResolvedLocale";
import type { Locale } from "@/lib/locale";

export default function SkipToContent({ initialLocale = "fr" }: { initialLocale?: Locale }) {
  const locale = useResolvedLocale(initialLocale);

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-foreground focus:px-4 focus:py-2 focus:font-label focus:text-xs focus:font-bold focus:uppercase focus:text-background"
    >
      {locale === "fr" ? "Aller au contenu" : "Skip to content"}
    </a>
  );
}
