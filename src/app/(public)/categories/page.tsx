import * as categoriesRepo from "@/lib/repositories/categories";
import CategoryGrid from "@/components/public/CategoryGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catégories | Le Relief Haïti",
  description: "Parcourir toutes les catégories de contenu",
};

export default async function CategoriesIndexPage() {
  let categories: (Record<string, unknown> & { _count: { articles: number } })[] = [];
  try {
    categories = await categoriesRepo.getCategoriesWithCounts(true);
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Rubriques</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          Catégories
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          Parcourez les dossiers, analyses et reportages publiés par la rédaction.
        </p>
      </header>

      {categories.length > 0 ? (
        <CategoryGrid variant="grid" categories={categories.map(c => ({
          name: c.name as string,
          slug: c.slug as string,
          description: c.description as string | null,
          _count: c._count as { articles: number },
        }))} />
      ) : (
        <p className="border-t border-border-subtle py-8 font-body text-lg text-muted">
          Aucune catégorie pour le moment.
        </p>
      )}
    </div>
  );
}
