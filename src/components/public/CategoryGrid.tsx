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
  { bg: "from-purple-600 to-indigo-700", dot: "bg-purple-400" },
  { bg: "from-rose-500 to-pink-700", dot: "bg-rose-400" },
  { bg: "from-teal-500 to-emerald-700", dot: "bg-teal-400" },
  { bg: "from-amber-500 to-orange-700", dot: "bg-amber-400" },
  { bg: "from-blue-500 to-cyan-700", dot: "bg-blue-400" },
  { bg: "from-fuchsia-500 to-purple-700", dot: "bg-fuchsia-400" },
];

export default function CategoryGrid({
  categories,
  className,
}: CategoryGridProps) {
  return (
    <div
      className={clsx(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5",
        className
      )}
    >
      {categories.map((cat, i) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className={clsx(
            "relative rounded-xl p-6 bg-gradient-to-br text-white overflow-hidden group transition-all duration-400 hover:scale-[1.03] hover:shadow-xl",
            categoryColors[i % categoryColors.length].bg
          )}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx("w-2 h-2 rounded-full", categoryColors[i % categoryColors.length].dot)} />
              <h3 className="font-bold text-lg">{cat.name}</h3>
            </div>
            {cat._count && (
              <p className="text-sm text-white/70 mt-1">
                {cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
