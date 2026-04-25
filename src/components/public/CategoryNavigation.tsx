"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PublicCategory } from "@/lib/editorial";

interface CategoryNavigationProps {
  categories: PublicCategory[];
  maxVisible?: number;
}

/**
 * Horizontal category navigation bar — displays key sections for quick navigation
 * Replaces need to scroll to see categories
 */
export default function CategoryNavigation({
  categories,
  maxVisible = 6,
}: CategoryNavigationProps) {
  const pathname = usePathname();
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";

  if (categories.length === 0) return null;

  const visibleCategories = categories.slice(0, maxVisible);

  return (
    <nav
      className="sticky top-[68px] z-40 border-b border-border-subtle bg-background/95 backdrop-blur-sm md:top-[88px]"
      aria-label={locale === "fr" ? "Rubriques principales" : "Main sections"}
    >
      <div className="newspaper-shell">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/categories/${category.slug}`}
              className="flex-shrink-0 border-r border-border-subtle px-3 py-3 font-label text-xs font-bold uppercase tracking-[1px] text-foreground transition-colors hover:bg-surface-elevated hover:text-primary sm:px-4 md:px-5"
            >
              {category.name}
            </Link>
          ))}

          {/* "All categories" link */}
          {categories.length > maxVisible && (
            <Link
              href={`/${locale}/categories`}
              className="flex-shrink-0 border-r border-border-subtle px-3 py-3 font-label text-xs font-bold uppercase tracking-[1px] text-muted transition-colors hover:bg-surface-elevated hover:text-primary sm:px-4 md:px-5"
            >
              {locale === "fr" ? "Toutes" : "All"}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
