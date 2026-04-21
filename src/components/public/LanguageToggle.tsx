"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { analyticsClient } from "@/lib/analytics-client";

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

  return (
    <Link
      href={targetPath}
      onClick={handleLanguageSwitch}
      className="flex items-center gap-0.5 border border-border-subtle px-2 py-2 font-label text-[10px] font-bold uppercase transition-colors duration-200 hover:bg-surface-elevated sm:text-xs"
      aria-label={isEnglish ? "Lire en français" : "Read the English selection"}
      title={isEnglish ? "Lire en français" : "Read the English selection"}
    >
      <span className={isEnglish ? "text-muted/50" : "text-foreground"}>
        FR
      </span>
      <span className="mx-0.5 text-muted/30">/</span>
      <span className={isEnglish ? "text-foreground" : "text-muted/50"}>
        EN
      </span>
    </Link>
  );
}
