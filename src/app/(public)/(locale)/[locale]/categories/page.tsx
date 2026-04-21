import CategoryGrid from "@/components/public/CategoryGrid";
import { getPublicCategories } from "@/lib/editorial";
import type { PublicCategory } from "@/lib/editorial";
import { validateLocale } from "@/lib/locale";

export const revalidate = 120;

export default async function LocalizedCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!validateLocale(locale)) return null;

  let categories: PublicCategory[] = [];
  try {
    categories = await getPublicCategories(true, locale);
  } catch {
    categories = [];
  }

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">{locale === "fr" ? "Rubriques" : "Categories"}</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          {locale === "fr" ? "Catégories" : "Categories"}
        </h1>
      </header>

      {categories.length > 0 ? (
        <CategoryGrid variant="grid" categories={categories} locale={locale} />
      ) : (
        <p className="border-t border-border-subtle py-8 font-body text-lg text-muted">
          {locale === "fr"
            ? "Aucune rubrique publiée pour le moment."
            : "No published categories yet."}
        </p>
      )}
    </div>
  );
}
