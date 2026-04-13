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

const categoryColors = [
  "from-blue-600 to-blue-800",
  "from-emerald-600 to-emerald-800",
  "from-purple-600 to-purple-800",
  "from-orange-600 to-orange-800",
  "from-rose-600 to-rose-800",
  "from-cyan-600 to-cyan-800",
];

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
          className={clsx(
            "relative rounded-xl p-6 bg-gradient-to-br text-white overflow-hidden group transition-transform hover:scale-[1.02]",
            categoryColors[i % categoryColors.length]
          )}
        >
          <h3 className="font-bold text-lg">{cat.name}</h3>
          {cat._count && (
            <p className="text-sm text-white/70 mt-1">
              {cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
