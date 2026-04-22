"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { analyticsClient } from "@/lib/analytics-client";

const LOCALE_COOKIE = "NEXT_LOCALE";

function readLocaleCookie(): "fr" | "en" {
  if (typeof document === "undefined") return "fr";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  const val = match?.[1];
  return val === "en" ? "en" : "fr";
}

export default function LanguageToggle() {
  const router = useRouter();
  const [locale, setLocaleState] = useState<"fr" | "en">(() =>
    readLocaleCookie(),
  );

  const targetLocale = locale === "fr" ? "en" : "fr";

  function handleSwitch() {
    // Persist in cookie (1 year)
    document.cookie = `${LOCALE_COOKIE}=${targetLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    setLocaleState(targetLocale);
    try {
      analyticsClient.trackLanguageSwitch({
        fromLocale: locale,
        toLocale: targetLocale,
        url: window.location.href,
      });
    } catch {
      // non-fatal
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="flex items-center gap-1 border border-border-subtle px-2 py-1.5 font-label text-[10px] font-bold uppercase transition-colors duration-200 hover:bg-surface-elevated sm:text-xs"
      aria-label={locale === "fr" ? "Read the English selection" : "Lire en français"}
      title={locale === "fr" ? "Read the English selection" : "Lire en français"}
    >
      <span className="text-muted/50">{locale.toUpperCase()}</span>
      <span className="mx-0.5 text-muted/30">·</span>
      <span className="text-foreground">{targetLocale.toUpperCase()}</span>
    </button>
  );
}
