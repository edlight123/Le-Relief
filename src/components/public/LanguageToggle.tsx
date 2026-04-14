"use client";

import { useLocale } from "@/hooks/useLocale";

export default function LanguageToggle() {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-0.5 px-2 py-1.5 rounded-full hover:bg-surface-elevated transition-colors duration-200 font-label text-xs font-bold uppercase tracking-wide"
      aria-label={locale === "fr" ? "Chanje lang an Kreyòl" : "Changer la langue en Français"}
      title={locale === "fr" ? "Lire en Kreyòl Ayisyen" : "Li an Fransè"}
    >
      <span className={locale === "fr" ? "text-foreground" : "text-muted/50"}>
        FR
      </span>
      <span className="text-muted/30 mx-0.5">/</span>
      <span className={locale === "ht" ? "text-foreground" : "text-muted/50"}>
        HT
      </span>
    </button>
  );
}
