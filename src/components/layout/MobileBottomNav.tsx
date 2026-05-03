"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Home, LayoutGrid, Mail, Search } from "lucide-react";
import { hrefForLocale, isActiveLocaleHref } from "@/lib/locale-routing";
import { useResolvedLocale } from "@/hooks/useResolvedLocale";
import type { Locale } from "@/lib/locale";

/** Px from top under which we consider the page "already at top" and a
 *  second tap should refresh instead of scrolling. */
const AT_TOP_THRESHOLD = 4;

const TABS_FR = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Rubriques", href: "/categories/politique", icon: LayoutGrid },
  { label: "Recherche", href: "/search", icon: Search },
  { label: "Lettre", href: "/newsletter", icon: Mail },
] as const;

const TABS_EN = [
  { label: "Home", href: "/", icon: Home },
  { label: "Sections", href: "/categories/politique", icon: LayoutGrid },
  { label: "Search", href: "/search", icon: Search },
  { label: "Newsletter", href: "/newsletter", icon: Mail },
] as const;

export default function MobileBottomNav({
  initialLocale = "fr",
}: {
  initialLocale?: Locale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useResolvedLocale(initialLocale);
  const tabs = locale === "fr" ? TABS_FR : TABS_EN;

  // When the user taps the *currently active* tab:
  //   • if the page is scrolled down → scroll smoothly back to top
  //   • if the page is already at top → soft-refresh the route
  // This mirrors the iOS-native "tap tab again" convention.
  const handleActiveTabTap = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (typeof window === "undefined") return;

      const scrolled =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      if (scrolled > AT_TOP_THRESHOLD) {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      } else {
        // Already at top → user tapped a second time → refresh.
        // router.refresh() re-runs server components without a full reload,
        // preserving PWA shell + client state (preferred in standalone mode).
        router.refresh();
      }
    },
    [router],
  );

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
              onClick={isActive ? handleActiveTabTap : undefined}
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
