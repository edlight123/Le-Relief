"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { analyticsClient } from "@/lib/analytics-client";
import { hrefForLocale, LOCALE_COOKIE } from "@/lib/locale-routing";
import type { Locale } from "@/lib/locale";
import { notifyLocaleChanged, useResolvedLocale } from "@/hooks/useResolvedLocale";

interface LanguageToggleProps {
  locale?: Locale;
  onSwitch?: () => void;
}

export default function LanguageToggle({ locale: controlledLocale, onSwitch }: LanguageToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedLocale = useResolvedLocale(controlledLocale ?? "fr");
  const locale = controlledLocale ?? resolvedLocale;

  const targetLocale = locale === "fr" ? "en" : "fr";
  const queryString = searchParams.toString();
  const currentHref = `${pathname || "/"}${queryString ? `?${queryString}` : ""}`;
  const targetHref = hrefForLocale(currentHref, targetLocale);

  function handleSwitch() {
    document.cookie = `${LOCALE_COOKIE}=${targetLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    notifyLocaleChanged();
    try {
      analyticsClient.trackLanguageSwitch({
        fromLocale: locale,
        toLocale: targetLocale,
        url: window.location.href,
      });
    } catch {
      // non-fatal
    }
    onSwitch?.();
    router.push(targetHref);
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="flex items-center gap-1 border border-border-subtle px-2 py-1.5 font-label text-[10px] font-bold uppercase transition-colors duration-200 hover:bg-surface-elevated sm:text-xs"
      aria-label={locale === "fr" ? "Read the English edition" : "Lire en français"}
      title={locale === "fr" ? "Read the English edition" : "Lire en français"}
    >
      <span className="text-muted/50">{locale.toUpperCase()}</span>
      <span className="mx-0.5 text-muted/30">·</span>
      <span className="text-foreground">{targetLocale.toUpperCase()}</span>
    </button>
  );
}
