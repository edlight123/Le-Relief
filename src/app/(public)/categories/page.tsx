import * as categoriesRepo from "@/lib/repositories/categories";
import CategoryGrid from "@/components/public/CategoryGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories | Le Relief Haiti",
  description: "Browse all content categories",
};

export default async function CategoriesIndexPage() {
  const categories = await categoriesRepo.getCategoriesWithCounts(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
        Categories
      </h1>

      <div className="section-divider mt-3 mb-12" />
      {categories.length > 0 ? (
        <CategoryGrid categories={categories.map(c => ({
          name: c.name as string,
          slug: c.slug as string,
          description: c.description as string | null,
          _count: c._count as { articles: number },
        }))} />
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400">
          No categories yet.
        </p>
      )}
    </div>
  );
}
