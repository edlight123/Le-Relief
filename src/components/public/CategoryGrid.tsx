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
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className="group rounded-xl p-5 bg-surface border border-border-subtle hover:border-primary/40 transition-all duration-200 article-card"
        >
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
            {cat.name}
          </h3>
          {cat._count && (
            <p className="text-xs text-muted mt-1">
              {cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
