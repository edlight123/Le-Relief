"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Search, User } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import ThemeToggle from "@/components/public/ThemeToggle";
import LanguageToggle from "@/components/public/LanguageToggle";
import { hrefForLocale, isActiveLocaleHref } from "@/lib/locale-routing";
import { useResolvedLocale } from "@/hooks/useResolvedLocale";
import type { Locale } from "@/lib/locale";

function formatEditionDate(locale: "fr" | "en") {
  const formatted = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return formatted.charAt(0).toLocaleUpperCase(locale === "fr" ? "fr-FR" : "en-US") + formatted.slice(1);
}

export default function Navbar({ initialLocale = "fr" }: { initialLocale?: Locale }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const locale = useResolvedLocale(initialLocale);
  const editionDate = formatEditionDate(locale);

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const withLocale = (href: string) => hrefForLocale(href, locale);

  const navItems =
    locale === "fr"
      ? siteConfig.nav.public
      : siteConfig.nav.publicEn;

  return (
    <header className="sticky top-0 z-50 border-b border-border-strong bg-background/95 backdrop-blur-sm">
      <div className="newspaper-shell">
        <div className="hidden items-center justify-between border-b border-border-subtle py-1.5 font-label text-[11px] font-semibold uppercase text-muted md:flex">
          <span className="normal-case">{editionDate}{editionDate ? " \u00B7 Port-au-Prince" : ""}</span>
          <span className="tracking-[1.5px]">
            {locale === "fr"
              ? "\u00C9dition num\u00E9rique \u00B7 Autorit\u00E9 calme, contexte et pr\u00E9cision"
              : "Digital edition \u00B7 Calm authority, context and precision"}
          </span>
          <Link href={withLocale("/login")} className="ink-link text-foreground">
            {locale === "fr" ? "Espace r\u00E9daction" : "Newsroom login"}
          </Link>
        </div>

        {/* Mobile: flex row — brand left-aligned, icons right */}
        <div className="relative flex items-center gap-3 py-3 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-3 md:py-4">
          <button
            className="relative z-10 shrink-0 md:hidden border border-border-subtle p-2 transition-colors hover:bg-surface-elevated"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={locale === "fr" ? "Ouvrir la navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-navigation"
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>

          {/* Brand — left-aligned on mobile next to hamburger, centred on md+ */}
          <Link
            href={withLocale("/")}
            prefetch={true}
            className="flex min-w-0 flex-1 items-center gap-2 md:justify-center md:gap-3"
          >
            <Image
              src="/logo.png"
              alt="Le Relief"
              width={40}
              height={40}
              sizes="(min-width: 768px) 44px, 32px"
              className="h-8 w-8 shrink-0 rounded-sm md:h-11 md:w-11"
              priority
            />
            <span className="truncate font-headline text-[1.6rem] font-extrabold leading-none text-foreground sm:text-5xl md:text-6xl">
              {siteConfig.name}
            </span>
          </Link>

          <div className="relative z-10 flex shrink-0 items-center justify-end gap-1 md:gap-2">
            <LanguageToggle locale={locale} />
            <Link
              href={withLocale("/search")}
              className="border border-border-subtle p-2 transition-colors hover:bg-surface-elevated"
              aria-label={locale === "fr" ? "Recherche" : "Search"}
            >
              <Search className="h-4 w-4 text-foreground" />
            </Link>
            <ThemeToggle />
            <Link
              href={withLocale("/login")}
              className="hidden border border-border-subtle p-2 transition-colors hover:bg-surface-elevated sm:flex"
              aria-label={locale === "fr" ? "Connexion" : "Login"}
            >
              <User className="h-4 w-4 text-foreground" />
            </Link>
          </div>
        </div>

        <nav className="hidden border-y border-border-strong py-1.5 md:block" style={{ boxShadow: "inset 0 1px 0 var(--background), inset 0 -1px 0 var(--background)" }}>
          <div className="flex items-center justify-center gap-6 lg:gap-10">
            {navItems.map((item) => {
              const href = withLocale(item.href);
              const isActive = isActiveLocaleHref(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  prefetch={true}
                  className={`relative font-label text-xs font-bold uppercase tracking-[1px] transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                  {isActive ? (
                    <span
                      className="absolute -bottom-[10px] left-0 right-0 h-[2px] w-full bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
        )}
        {mobileOpen && (
          <nav id="public-mobile-navigation" className="relative z-50 border-t border-border-strong bg-background pb-4 md:hidden">
            {/* Edition date strip */}
            <div className="border-b border-border-subtle px-1 py-2">
              <p className="font-label text-[10px] font-semibold uppercase tracking-[1.2px] text-muted">
                {editionDate}
                {editionDate ? " · Port-au-Prince" : ""}
              </p>
            </div>

            {/* Nav links */}
            <div className="mt-1 space-y-0">
              {navItems.map((item) => {
                const href = withLocale(item.href);
                const isActive = isActiveLocaleHref(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    prefetch={true}
                    className={`flex items-center justify-between border-b border-border-subtle px-1 py-3.5 font-label text-sm font-bold uppercase tracking-[0.5px] transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-foreground hover:text-primary"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Bottom controls */}
            <div className="mt-4 flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <LanguageToggle locale={locale} onSwitch={() => setMobileOpen(false)} />
                <ThemeToggle />
              </div>
              <div className="flex items-center gap-3 font-label text-xs uppercase">
                <Link
                  href={withLocale("/login")}
                  onClick={() => setMobileOpen(false)}
                  className="ink-link text-muted"
                >
                  {locale === "fr" ? "Connexion" : "Login"}
                </Link>
                <Link
                  href={withLocale("/signup")}
                  onClick={() => setMobileOpen(false)}
                  className="border border-border-strong px-3 py-2 font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  {locale === "fr" ? "S'inscrire" : "Sign up"}
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
