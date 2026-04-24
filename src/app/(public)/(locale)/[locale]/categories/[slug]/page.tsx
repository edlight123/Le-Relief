import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import Breadcrumb from "@/components/public/Breadcrumb";
import { getCategoryPageContent } from "@/lib/editorial";
import { validateLocale } from "@/lib/locale";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalAlternates,
  buildEditorialOgImage,
  buildMetaDescription,
  serializeJsonLd,
} from "@/lib/seo";

export const revalidate = 120;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  if (!validateLocale(locale)) return {};
  const content = await getCategoryPageContent(slug, locale);
  if (!content) return {};

  const title = `${content.category.name} | Le Relief`;
  const description = buildMetaDescription({
    title,
    excerpt:
      content.category.description ||
      (locale === "fr"
        ? `Articles, analyses, dossiers et décryptages dans la rubrique ${content.category.name}.`
        : `Articles, analysis and explainers in ${content.category.name}.`),
    locale,
    keyword: content.category.name,
    cta:
      locale === "fr"
        ? "Explorez les derniers articles de cette rubrique."
        : "Explore the latest stories from this section.",
  });

  return {
    title,
    description,
    alternates: buildCanonicalAlternates(`/${locale}/categories/${slug}`, {
      fr: `/fr/categories/${slug}`,
      en: `/en/categories/${slug}`,
      "x-default": `/fr/categories/${slug}`,
    }),
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      url: `/${locale}/categories/${slug}`,
      images: buildEditorialOgImage({
        title: content.category.name,
        category: locale === "fr" ? "Rubrique" : "Section",
        locale,
        alt: content.category.name,
      }),
    },
  };
}

export default async function LocalizedCategoryPage({ params }: Props) {
  const { slug, locale } = await params;
  if (!validateLocale(locale)) notFound();

  const content = await getCategoryPageContent(slug, locale);
  if (!content) notFound();

  const { category, featured, articles } = content;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: locale === "fr" ? "Accueil" : "Home", item: `/${locale}` },
    { name: locale === "fr" ? "Rubriques" : "Categories", item: `/${locale}/categories` },
    { name: category.name, item: `/${locale}/categories/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="newspaper-shell py-10 sm:py-14">
      <Breadcrumb
        locale={locale}
        crumbs={[
          { label: locale === "fr" ? "Accueil" : "Home", href: "/" },
          {
            label: locale === "fr" ? "Rubriques" : "Categories",
            href: "/categories",
          },
          { label: category.name },
        ]}
      />
      <header className="mb-10 border-y-2 border-border-strong py-8 text-center sm:py-12">
        <p className="page-kicker mb-4" style={{ letterSpacing: "1.4px" }}>
          {locale === "fr" ? "Rubrique" : "Section"}
        </p>
        <h1 className="editorial-title mx-auto max-w-4xl text-5xl text-foreground sm:text-7xl lg:text-8xl">
          {category.name}
        </h1>
        <p className="editorial-deck mx-auto mt-5 max-w-2xl font-body text-lg sm:text-xl">
          {category.description ||
            (locale === "fr"
              ? `Actualités, analyses et reportages de la rédaction du Relief sur ${category.name.toLowerCase()}.`
              : `News, analysis and reporting from the Le Relief newsroom on ${category.name.toLowerCase()}.`)}
        </p>
      </header>

      {featured ? (
        <section className="mb-14">
          <div className="mb-5 flex items-baseline justify-between border-t border-border-strong pt-3">
            <p className="section-kicker">{locale === "fr" ? "À la une de la rubrique" : "Top of the section"}</p>
          </div>
          <ArticleCard article={featured} variant="list" locale={locale} />
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section>
          <div className="mb-5 flex items-baseline justify-between border-t border-border-strong pt-3">
            <p className="section-kicker">{locale === "fr" ? "Tous les articles" : "All articles"}</p>
          </div>
          <LatestArticlesFeed
            initialArticles={articles}
            categoryId={category.id}
            variant="grid"
            locale={locale}
          />
        </section>
      ) : null}
      </div>
    </>
  );
}
