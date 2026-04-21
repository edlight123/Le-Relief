"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { analyticsClient } from "@/lib/analytics-client";

const LOCALE_LABELS: Record<string, { flag: string; label: string }> = {
  fr: { flag: "🇫🇷", label: "FR" },
  en: { flag: "🇬🇧", label: "EN" },
};

export default function LanguageToggle() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const targetLocale = isEnglish ? "fr" : "en";

  const targetPath = (() => {
    if (!pathname || pathname === "/") return `/${targetLocale}`;
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "fr" || segments[0] === "en") {
      return `/${targetLocale}/${segments.slice(1).join("/")}`.replace(/\/$/, "") || `/${targetLocale}`;
    }
    if (pathname === "/en") return "/fr";
    return `/${targetLocale}${pathname}`;
  })();

  const handleLanguageSwitch = () => {
    try {
      analyticsClient.trackLanguageSwitch({
        fromLocale: isEnglish ? "en" : "fr",
        toLocale: isEnglish ? "fr" : "en",
        url: window.location.href,
      });
    } catch (error) {
      console.error("[analytics] Failed to track language switch:", error);
    }
  };

  const current = LOCALE_LABELS[isEnglish ? "en" : "fr"];
  const target = LOCALE_LABELS[targetLocale];

  return (
    <Link
      href={targetPath}
      onClick={handleLanguageSwitch}
      className="flex items-center gap-1 border border-border-subtle px-2 py-1.5 font-label text-[10px] font-bold uppercase transition-colors duration-200 hover:bg-surface-elevated sm:text-xs"
      aria-label={isEnglish ? "Lire en français" : "Read the English selection"}
      title={isEnglish ? "Lire en français" : "Read the English selection"}
    >
      <span className="text-muted/50">{current.flag} {current.label}</span>
      <span className="mx-0.5 text-muted/30">·</span>
      <span className="text-foreground">{target.flag} {target.label}</span>
    </Link>
  );
}
