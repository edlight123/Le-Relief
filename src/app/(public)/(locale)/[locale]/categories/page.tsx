import type { Metadata } from "next";
import CategoryGrid from "@/components/public/CategoryGrid";
import { getPublicCategories } from "@/lib/editorial";
import type { PublicCategory } from "@/lib/editorial";
import { validateLocale } from "@/lib/locale";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalAlternates,
  buildMetaDescription,
  serializeJsonLd,
} from "@/lib/seo";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!validateLocale(locale)) return {};

  return {
    title: locale === "fr" ? "Catégories" : "Categories",
    description: buildMetaDescription({
      title: locale === "fr" ? "Catégories Le Relief" : "Le Relief categories",
      excerpt:
        locale === "fr"
          ? "Explorez les rubriques de Le Relief pour suivre l'actualité, les analyses et les dossiers par thème."
          : "Explore Le Relief sections to follow news, analysis and explainers by topic.",
      locale,
      keyword: locale === "fr" ? "rubriques actualité Haïti" : "Haiti news sections",
      cta:
        locale === "fr" ? "Parcourez les thématiques de la rédaction." : "Browse the newsroom sections.",
    }),
    alternates: buildCanonicalAlternates(`/${locale}/categories`, {
      fr: "/fr/categories",
      en: "/en/categories",
      "x-default": "/fr/categories",
    }),
  };
}

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

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: locale === "fr" ? "Accueil" : "Home", item: `/${locale}` },
    { name: locale === "fr" ? "Catégories" : "Categories", item: `/${locale}/categories` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">{locale === "fr" ? "Rubriques" : "Categories"}</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          {locale === "fr" ? "Catégories" : "Categories"}
        </h1>
        <p className="mt-4 max-w-3xl font-body text-base leading-relaxed text-muted sm:text-lg">
          {locale === "fr"
            ? "Retrouvez les grands sujets couverts par la rédaction et découvrez les articles liés à chaque thématique."
            : "Browse the main beats covered by the newsroom and discover the latest stories for each topic."}
        </p>
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
    </>
  );
}
