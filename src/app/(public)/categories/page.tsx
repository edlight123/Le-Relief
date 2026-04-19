import CategoryGrid from "@/components/public/CategoryGrid";
import { getPublicCategories } from "@/lib/public-content";
import type { PublicCategory } from "@/lib/editorial";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rubriques | Le Relief Haïti",
  description:
    "Parcourir les rubriques officielles de Le Relief: politique, économie, société, culture, international, opinion et dossiers.",
};

export default async function CategoriesIndexPage() {
  let categories: PublicCategory[] = [];
  try {
    categories = await getPublicCategories(true);
  } catch {
    categories = [];
  }

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Rubriques</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          Catégories
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          Les rubriques publiques affichent uniquement les espaces éditoriaux où
          des articles publiés sont disponibles.
        </p>
      </header>

      {categories.length > 0 ? (
        <CategoryGrid variant="grid" categories={categories} />
      ) : (
        <p className="border-t border-border-subtle py-8 font-body text-lg text-muted">
          Aucune rubrique publiée pour le moment.
        </p>
      )}
    </div>
  );
}
