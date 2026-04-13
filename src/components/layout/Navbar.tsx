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
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/85 backdrop-blur-xl border-b border-border-subtle">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground group"
          >
            <Image
              src="/logo.png"
              alt="Le Relief Haiti"
              width={40}
              height={40}
              className="rounded-full ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300"
              priority
              unoptimized
            />
            <span className="group-hover:text-primary transition-colors duration-300">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {siteConfig.nav.public.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors duration-300 color-underline"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/search"
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors duration-300"
            >
              <Search className="h-4 w-4 text-foreground/50" />
            </Link>
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors duration-300"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-5 py-2 bg-gradient-to-r from-primary to-accent-rose text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
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
                className="block px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 px-3 pt-3 border-t border-border-subtle mt-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="text-sm font-medium text-foreground/60"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium px-5 py-2 bg-gradient-to-r from-primary to-accent-rose text-white rounded-xl"
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
