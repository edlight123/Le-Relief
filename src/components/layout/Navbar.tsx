"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import ThemeToggle from "@/components/public/ThemeToggle";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-border-subtle">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <Image
              src="/logo.png"
              alt="Le Relief Haiti"
              width={36}
              height={36}
              className="rounded-full"
              priority
              unoptimized
            />
            <span className="text-lg font-bold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {siteConfig.nav.public.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted hover:text-foreground transition-colors duration-200 hover-underline"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/search"
              className="p-2 rounded-full hover:bg-surface-elevated transition-colors duration-200"
            >
              <Search className="h-4 w-4 text-muted" />
            </Link>
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors duration-200 ml-2"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200 ml-1"
            >
              Sign Up
            </Link>
          </div>

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

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-border-subtle mt-2 pt-4 space-y-1 animate-fade-in">
            {siteConfig.nav.public.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 px-3 pt-3 border-t border-border-subtle mt-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="text-sm text-muted"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium px-4 py-2 bg-primary text-white rounded-full"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
