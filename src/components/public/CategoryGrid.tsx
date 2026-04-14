import Link from "next/link";
import { clsx } from "clsx";

interface Category {
  name: string;
  slug: string;
  description?: string | null;
  _count?: { articles: number };
}

interface CategoryGridProps {
  categories: Category[];
  className?: string;
  variant?: "grid" | "sidebar";
}

const categoryIcons: Record<string, string> = {
  world: "🌍",
  technology: "⚡",
  culture: "🎭",
  business: "📊",
  science: "🔬",
  opinion: "💬",
  politics: "🏛️",
  environment: "🌿",
  health: "🏥",
  arts: "🎨",
  sport: "⚽",
};

export default function CategoryGrid({
  categories,
  className,
  variant = "sidebar",
}: CategoryGridProps) {
  /* Sidebar variant - vertical list with icons */
  if (variant === "sidebar") {
    return (
      <nav className={clsx("flex flex-col gap-1", className)}>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="flex items-center gap-4 py-3 px-4 rounded-md transition-transform duration-200 hover:translate-x-1 text-muted group active:opacity-70"
          >
            <span className="text-lg">{categoryIcons[cat.slug] || "📰"}</span>
            <span className="font-medium text-sm font-body">{cat.name}</span>
            {cat._count && (
              <span className="ml-auto text-[10px] text-muted/60 font-label">
                {cat._count.articles}
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
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3",
        className
      )}
    >
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className="group relative rounded-lg p-5 bg-surface border border-border-subtle hover:border-primary/30 transition-all duration-300 article-card overflow-hidden text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="text-2xl mb-3">
              {categoryIcons[cat.slug] || "📰"}
            </div>
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-300 font-headline">
              {cat.name}
            </h3>
            {cat._count && (
              <p className="text-[11px] text-muted mt-1.5 font-label font-medium">
                {cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
