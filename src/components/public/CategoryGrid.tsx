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
}

const categoryIcons: Record<string, string> = {
  world: "🌍",
  technology: "⚡",
  culture: "🎭",
  business: "📊",
  science: "🔬",
  opinion: "💬",
};

export default function CategoryGrid({
  categories,
  className,
}: CategoryGridProps) {
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
          className="group relative rounded-2xl p-5 bg-surface border border-border-subtle hover:border-primary/30 transition-all duration-300 article-card overflow-hidden text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="text-2xl mb-3">
              {categoryIcons[cat.slug] || "📰"}
            </div>
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-300">
              {cat.name}
            </h3>
            {cat._count && (
              <p className="text-[11px] text-muted mt-1.5 font-medium">
                {cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
