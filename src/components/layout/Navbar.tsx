"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Search, Globe } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import ThemeToggle from "@/components/public/ThemeToggle";
import LanguageToggle from "@/components/public/LanguageToggle";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
  const withLocale = (href: string) => {
    if (href === "/") return `/${locale}`;
    return `/${locale}${href}`;
  };

  const editionDate = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const navItems =
    locale === "fr"
      ? siteConfig.nav.public
      : [
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: "Search", href: "/search" },
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ];

  return (
    <header className="sticky top-0 z-50 double-rule-bottom bg-background/95 backdrop-blur-sm">
      <div className="newspaper-shell">
        {/* Top utility row */}
        <div className="hidden items-center justify-between border-b border-border-subtle py-2 font-label text-[11px] font-semibold uppercase tracking-widest text-muted md:flex">
          <span className="capitalize">{editionDate}</span>
          <span className="italic normal-case tracking-normal text-muted">
            {locale === "fr"
              ? "Autorité calme. Contexte. Précision."
              : "Calm authority. Context. Precision."}
          </span>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span aria-hidden className="h-3 w-px bg-border-subtle" />
            <ThemeToggle />
          </div>
        </div>

        {/* Masthead row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-4 md:py-7">
          {/* Left: section/search shortcuts */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              className="border border-border-subtle p-2 transition-colors hover:bg-surface-elevated md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={locale === "fr" ? "Ouvrir la navigation" : "Open navigation"}
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
            <Link
              href={withLocale("/categories")}
              aria-label={locale === "fr" ? "Toutes les rubriques" : "All sections"}
              className="hidden items-center gap-2 font-label text-[11px] font-bold uppercase tracking-widest text-foreground transition-colors hover:text-primary md:inline-flex"
            >
              <Globe className="h-4 w-4" aria-hidden />
              <span>{locale === "fr" ? "Sections" : "Sections"}</span>
            </Link>
            <Link
              href={withLocale("/search")}
              aria-label={locale === "fr" ? "Recherche" : "Search"}
              className="hidden items-center gap-2 font-label text-[11px] font-bold uppercase tracking-widest text-foreground transition-colors hover:text-primary md:inline-flex"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span>{locale === "fr" ? "Recherche" : "Search"}</span>
            </Link>
          </div>

          {/* Center: masthead */}
          <Link
            href={`/${locale}`}
            className="flex flex-col items-center justify-center text-center"
          >
            <span className="font-headline text-4xl font-extrabold italic leading-none tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              {siteConfig.name}
            </span>
            <span className="mt-2 hidden font-label text-[10px] font-semibold uppercase tracking-[0.4em] text-muted md:block">
              {locale === "fr" ? "Édition Haïti · Numérique" : "Haiti Edition · Digital"}
            </span>
          </Link>

          {/* Right: account actions */}
          <div className="flex items-center justify-end gap-2 md:gap-3">
            <Link
              href={withLocale("/login")}
              className="hidden px-3 py-2 font-label text-[11px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-surface-elevated sm:inline-block"
            >
              {locale === "fr" ? "Connexion" : "Sign In"}
            </Link>
            <Link
              href={withLocale("/signup")}
              className="bg-foreground px-4 py-2 font-label text-[11px] font-extrabold uppercase tracking-widest text-background transition-colors hover:bg-primary md:px-5 md:py-2.5"
            >
              {locale === "fr" ? "S'abonner" : "Subscribe"}
            </Link>
          </div>
        </div>

        {/* Section nav */}
        <nav className="hidden border-t border-border-strong py-2.5 md:block">
          <div className="flex items-center justify-center gap-8 lg:gap-12">
            {navItems.map((item) => {
              const href = withLocale(item.href);
              const isActive = pathname === href;
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`font-headline text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    isActive
                      ? "border-b-2 border-foreground pb-0.5 text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
        )}
        {mobileOpen && (
          <nav className="relative z-50 space-y-1 border-t border-border-strong py-3 md:hidden">
            {navItems.map((item) => {
              const href = withLocale(item.href);
              const isActive = pathname === href;
              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`block border-b border-border-subtle px-1 py-3 font-label text-sm font-bold uppercase transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="flex items-center justify-between px-1 pt-3">
              <div className="flex items-center gap-3">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <div className="flex items-center gap-3 font-label text-xs uppercase">
                <Link
                  href={withLocale("/login")}
                  onClick={() => setMobileOpen(false)}
                  className="ink-link text-muted"
                >
                  {locale === "fr" ? "Connexion" : "Sign in"}
                </Link>
                <Link
                  href={withLocale("/signup")}
                  onClick={() => setMobileOpen(false)}
                  className="bg-foreground px-3 py-2 font-bold text-background transition-colors hover:bg-primary"
                >
                  {locale === "fr" ? "S'abonner" : "Subscribe"}
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
