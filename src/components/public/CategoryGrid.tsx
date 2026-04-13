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

const categoryEmojis = ["📖", "🌍", "💡", "🎯", "🔥", "⚡", "🏆", "💎"];

export default function CategoryGrid({
  categories,
  className,
}: CategoryGridProps) {
  return (
    <div
      className={clsx(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {categories.map((cat, i) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className="group relative rounded-xl p-5 bg-surface border border-border-subtle overflow-hidden premium-card"
        >
          {/* Subtle top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/50 via-accent-rose/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">{categoryEmojis[i % categoryEmojis.length]}</span>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                {cat.name}
              </h3>
              {cat._count && (
                <p className="text-xs text-foreground/40 mt-1">
                  {cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
