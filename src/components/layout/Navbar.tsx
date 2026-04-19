"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Search, User } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import ThemeToggle from "@/components/public/ThemeToggle";
import LanguageToggle from "@/components/public/LanguageToggle";

const editionDate = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border-strong bg-background/95 backdrop-blur-sm">
      <div className="newspaper-shell">
        <div className="hidden items-center justify-between border-b border-border-subtle py-2 font-label text-[11px] font-semibold uppercase text-muted md:flex">
          <span>{editionDate}</span>
          <span>Autorité calme, contexte et précision</span>
          <Link href="/login" className="ink-link text-foreground">
            Espace rédaction
          </Link>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 md:py-5">
          <button
            className="md:hidden border border-border-subtle p-2 transition-colors hover:bg-surface-elevated"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Ouvrir la navigation"
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-3 md:justify-center">
            <Image
              src="/logo.png"
              alt="Le Relief"
              width={40}
              height={40}
              className="h-8 w-8 rounded-sm md:h-10 md:w-10"
              priority
            />
            <span className="font-headline text-3xl font-extrabold leading-none text-foreground sm:text-4xl md:text-6xl">
              {siteConfig.name}
            </span>
          </Link>

          <div className="flex items-center justify-end gap-1 md:gap-2">
            <LanguageToggle />
            <Link
              href="/search"
              className="border border-border-subtle p-2 transition-colors hover:bg-surface-elevated"
              aria-label="Recherche"
            >
              <Search className="h-4 w-4 text-foreground" />
            </Link>
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden border border-border-subtle p-2 transition-colors hover:bg-surface-elevated sm:flex"
              aria-label="Connexion"
            >
              <User className="h-4 w-4 text-foreground" />
            </Link>
          </div>
        </div>

        <nav className="hidden border-t border-border-strong py-2 md:block">
          <div className="flex items-center justify-center gap-6 lg:gap-10">
            {siteConfig.nav.public.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-label text-xs font-bold uppercase transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {mobileOpen && (
          <nav className="space-y-1 border-t border-border-strong py-3 md:hidden">
            {siteConfig.nav.public.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="ink-link text-muted"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="border border-border-strong px-3 py-2 font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  S&apos;inscrire
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
