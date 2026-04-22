import Link from "next/link";
import { clsx } from "clsx";
import type { Locale } from "@/lib/i18n";

interface Category {
  name: string;
  slug: string;
  description?: string | null;
  count?: number;
  _count?: { articles: number };
}

interface CategoryGridProps {
  categories: Category[];
  className?: string;
  variant?: "grid" | "sidebar";
  locale?: Locale;
}

export default function CategoryGrid({
  categories,
  className,
  variant = "sidebar",
  locale = "fr",
}: CategoryGridProps) {
  /* Sidebar variant - vertical list with icons */
  if (variant === "sidebar") {
    return (
      <nav className={clsx("flex flex-col", className)}>
        {categories.map((cat, index) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group flex items-center gap-4 border-b border-border-subtle py-3 text-muted transition-colors hover:text-primary"
          >
            <span className="font-label text-[10px] font-extrabold uppercase text-muted/70">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-headline text-lg font-bold leading-none text-foreground group-hover:text-primary">
              {cat.name}
            </span>
            {(cat._count?.articles ?? cat.count) !== undefined && (
              <span className="ml-auto font-label text-[10px] font-bold uppercase text-muted">
                {cat._count?.articles ?? cat.count}
              </span>
            )}
          </Link>
        ))}
      </nav>
    );
  }

  /* Grid variant - for full-width sections */
  return (
    <div
      className={clsx(
        "grid grid-cols-1 gap-0 border-t border-border-strong sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {categories.map((cat, index) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className="group border-b border-border-subtle px-0 py-6 transition-colors hover:bg-surface-newsprint sm:px-5"
        >
          <div className="flex items-start gap-4">
            <span className="mt-1 font-label text-[10px] font-extrabold uppercase text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
            <h3 className="font-headline text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {cat.name}
            </h3>
            {(cat._count || cat.count !== undefined) && (
              <p className="mt-2 font-label text-[10px] font-bold uppercase text-muted">
                {cat._count?.articles ?? cat.count} {locale === "fr" ? "article" : "article"}
                {(cat._count?.articles ?? cat.count) !== 1 ? (locale === "fr" ? "s" : "s") : ""}
              </p>
            )}
            {cat.description && (
              <p className="mt-3 line-clamp-2 font-body text-base leading-relaxed text-muted">
                {cat.description}
              </p>
            )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
