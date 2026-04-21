import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import Breadcrumb from "@/components/public/Breadcrumb";
import { getCategoryPageContent } from "@/lib/editorial";
import { validateLocale } from "@/lib/locale";

export const revalidate = 120;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  if (!validateLocale(locale)) return {};
  const content = await getCategoryPageContent(slug, locale);
  if (!content) return {};

  return {
    title: `${content.category.name} | Le Relief`,
    description:
      content.category.description ||
      (locale === "fr"
        ? `Articles, analyses et dossiers dans la rubrique ${content.category.name}.`
        : `Articles and analysis in ${content.category.name}.`),
    alternates: {
      canonical: `/${locale}/categories/${slug}`,
      languages: {
        fr: `/fr/categories/${slug}`,
        en: `/en/categories/${slug}`,
        "x-default": `/fr/categories/${slug}`,
      },
    },
  };
}

export default async function LocalizedCategoryPage({ params }: Props) {
  const { slug, locale } = await params;
  if (!validateLocale(locale)) notFound();

  const content = await getCategoryPageContent(slug, locale);
  if (!content) notFound();

  const { category, featured, articles } = content;

  return (
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
  );
}
