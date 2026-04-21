import { Suspense } from "react";
import type { Metadata } from "next";
import SearchExperience from "@/components/public/SearchExperience";
import { validateLocale } from "@/lib/locale";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalAlternates,
  buildMetaDescription,
  buildRobotsDirective,
  serializeJsonLd,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!validateLocale(locale)) return {};

  return {
    title: locale === "fr" ? "Recherche avancée" : "Advanced search",
    description: buildMetaDescription({
      title: locale === "fr" ? "Recherche avancée Le Relief" : "Le Relief advanced search",
      excerpt:
        locale === "fr"
          ? "Recherchez des articles par pertinence, date, rubrique, auteur et format éditorial."
          : "Search articles by relevance, date, category, author and editorial format.",
      locale,
      keyword: locale === "fr" ? "recherche Le Relief" : "Le Relief search",
      cta:
        locale === "fr"
          ? "Affinez votre recherche sur Le Relief."
          : "Refine your search on Le Relief.",
    }),
    alternates: buildCanonicalAlternates(`/${locale}/search`, {
      fr: "/fr/search",
      en: "/en/search",
      "x-default": "/fr/search",
    }),
    robots: buildRobotsDirective("draft", true),
  };
}

export default async function LocalizedSearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!validateLocale(locale)) return null;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: locale === "fr" ? "Accueil" : "Home", item: `/${locale}` },
    { name: locale === "fr" ? "Recherche" : "Search", item: `/${locale}/search` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<div className="newspaper-shell py-16" />}>
        <SearchExperience />
      </Suspense>
    </>
  );
}
