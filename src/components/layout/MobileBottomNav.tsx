"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, User } from "lucide-react";
import { hrefForLocale, isActiveLocaleHref } from "@/lib/locale-routing";
import { useResolvedLocale } from "@/hooks/useResolvedLocale";
import type { Locale } from "@/lib/locale";

const TABS_FR = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Rubriques", href: "/categories/politique", icon: LayoutGrid },
  { label: "Recherche", href: "/search", icon: Search },
  { label: "Compte", href: "/login", icon: User },
] as const;

const TABS_EN = [
  { label: "Home", href: "/", icon: Home },
  { label: "Sections", href: "/categories/politique", icon: LayoutGrid },
  { label: "Search", href: "/search", icon: Search },
  { label: "Account", href: "/login", icon: User },
] as const;

export default function MobileBottomNav({
  initialLocale = "fr",
}: {
  initialLocale?: Locale;
}) {
  const pathname = usePathname();
  const locale = useResolvedLocale(initialLocale);
  const tabs = locale === "fr" ? TABS_FR : TABS_EN;

  return (
    <nav
      aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-strong bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-14 items-stretch">
        {tabs.map(({ label, href, icon: Icon }) => {
          const resolvedHref = hrefForLocale(href, locale);
          const isActive = isActiveLocaleHref(pathname, href);

          return (
            <Link
              key={href}
              href={resolvedHref}
              prefetch
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? "text-primary" : "text-muted hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 bg-primary"
                  aria-hidden
                />
              )}
              <Icon
                className={`h-5 w-5 ${isActive ? "stroke-[2.2px]" : "stroke-[1.8px]"}`}
                aria-hidden
              />
              <span className="font-label text-[9px] font-bold uppercase tracking-[0.8px]">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
