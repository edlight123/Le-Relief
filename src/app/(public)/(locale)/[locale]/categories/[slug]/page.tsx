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
  buildMetaDescription,
  buildOgImage,
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
      images: buildOgImage("/logo.png", content.category.name),
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
          { label: locale === "fr" ? "Accueil" : "Home", href: `/${locale}` },
          {
            label: locale === "fr" ? "Rubriques" : "Categories",
            href: `/${locale}/categories`,
          },
          { label: category.name },
        ]}
      />
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">{locale === "fr" ? "Rubrique" : "Category"}</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          {category.name}
        </h1>
        <p className="mt-4 max-w-3xl font-body text-base leading-relaxed text-muted sm:text-lg">
          {category.description ||
            (locale === "fr"
              ? `Retrouvez les dernières actualités, analyses et reportages de la rubrique ${category.name}.`
              : `Browse the latest news, analysis and reporting from ${category.name}.`)}
        </p>
      </header>

      {featured ? (
        <section className="mb-12">
          <div className="mb-5 border-t-2 border-border-strong pt-3">
            <p className="section-kicker mb-2">
              {locale === "fr" ? "Article vedette" : "Featured"}
            </p>
            <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground">
              {locale === "fr" ? "À lire dans cette rubrique" : "Read in this section"}
            </h2>
          </div>
          <div className="max-w-4xl">
            <ArticleCard article={featured} variant="list" locale={locale} />
          </div>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section>
          <div className="mb-5 border-t border-border-strong pt-3">
            <p className="section-kicker mb-2">{locale === "fr" ? "Archives" : "Archive"}</p>
            <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground">
              {locale === "fr" ? "Tous les articles" : "All articles"}
            </h2>
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
