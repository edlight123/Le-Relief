"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguageToggle() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");

  return (
    <Link
      href={isEnglish ? "/" : "/en"}
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
