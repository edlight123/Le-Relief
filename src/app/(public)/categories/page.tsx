import { db } from "@/lib/db";
import CategoryGrid from "@/components/public/CategoryGrid";

export const metadata = {
  title: "Categories | Le Relief",
  description: "Browse all content categories",
};

export default async function CategoriesIndexPage() {
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { articles: { where: { status: "published" } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-12">
        Categories
      </h1>
      {categories.length > 0 ? (
        <CategoryGrid categories={categories} />
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400">
          No categories yet.
        </p>
      )}
    </div>
  );
}
