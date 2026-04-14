"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Search, User } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import ThemeToggle from "@/components/public/ThemeToggle";
import LanguageToggle from "@/components/public/LanguageToggle";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-background/95 dark:bg-background/95 backdrop-blur-md border-b-2 border-foreground/90 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Brand - Newspaper style */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
          >
            <Image
              src="/logo.png"
              alt="Le Relief"
              width={32}
              height={32}
              className="rounded-full sm:w-9 sm:h-9"
              priority
              unoptimized
            />
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-foreground italic font-headline tracking-tighter cursor-pointer">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop nav - Category style links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {siteConfig.nav.public.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-body transition-colors duration-200 ${
                    isActive
                      ? "text-primary font-bold border-b-2 border-primary pb-1"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <Link
              href="/search"
              className="p-2 rounded-full hover:bg-surface-elevated transition-all duration-300 active:scale-95"
            >
              <Search className="h-5 w-5 text-foreground" />
            </Link>
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:flex p-2 rounded-full hover:bg-surface-elevated transition-all duration-300 active:scale-95"
            >
              <User className="h-5 w-5 text-foreground" />
            </Link>
            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-surface-elevated transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-border-subtle mt-3 pt-3 space-y-1 animate-fade-in">
            {siteConfig.nav.public.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-3 text-base rounded-lg transition-colors ${
                    isActive
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-foreground hover:text-primary hover:bg-surface-elevated"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="flex items-center gap-3 px-3 pt-3 border-t border-border-subtle mt-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium px-4 py-2 bg-primary text-white rounded-full"
              >
                S&apos;inscrire
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
