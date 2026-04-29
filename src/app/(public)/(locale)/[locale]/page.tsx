import type { Metadata } from "next";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import CategoryGrid from "@/components/public/CategoryGrid";
import SectionHeader from "@/components/public/SectionHeader";
import MostReadList from "@/components/public/MostReadList";
import NewsletterBlock from "@/components/public/NewsletterBlock";
import { getHomepageContent } from "@/lib/editorial";
import { validateLocale } from "@/lib/locale";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalAlternates,
  buildEditorialOgImage,
  buildMetaDescription,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!validateLocale(locale)) return {};

  const title = locale === "fr" ? "Le Relief — Média numérique haïtien" : "Le Relief — Haitian digital publication";
  const description = buildMetaDescription({
    title,
    excerpt:
      locale === "fr"
        ? "Actualité, analyse, opinion et dossiers d'intérêt public en Haïti et dans la diaspora."
        : "News, analysis, opinion and public-interest reporting on Haiti and its diaspora.",
    locale,
    keyword: locale === "fr" ? "actualité Haïti" : "Haiti news",
    cta:
      locale === "fr"
        ? "Suivez la couverture complète sur Le Relief."
        : "Explore the latest coverage on Le Relief.",
  });

  return {
    title,
    description,
    alternates: buildCanonicalAlternates(`/${locale}`, {
      fr: "/fr",
      en: "/en",
      "x-default": "/fr",
    }),
    openGraph: {
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      url: `/${locale}`,
      title,
      description,
      images: buildEditorialOgImage({
        title: locale === "fr" ? "Le Relief" : "Le Relief",
        category: locale === "fr" ? "Édition numérique" : "Digital edition",
        locale,
        alt: "Le Relief",
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.png"],
    },
  };
}



export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!validateLocale(locale)) return null;

  const {
    hero,
    secondary,
    latest,
    editorial,
    mostRead,
    categories,
    showNewsletter,
  } = await getHomepageContent(locale);

  const organizationJsonLd = buildOrganizationJsonLd(locale);
  const websiteJsonLd = buildWebSiteJsonLd(locale);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: locale === "fr" ? "Accueil" : "Home", item: `/${locale}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <HeroSection article={hero || undefined} locale={locale} />

      <div className="newspaper-shell">
        {secondary.length > 0 ? (
          <section className="mb-8 sm:mb-10">
            <SectionHeader
              kicker={locale === "fr" ? "À la une" : "Top stories"}
              title={locale === "fr" ? "Les autres titres" : "More headlines"}
              locale={locale}
            />
            <div
              className={`grid gap-0 ${
                secondary.length >= 3
                  ? "md:grid-cols-3"
                  : secondary.length === 2
                  ? "md:grid-cols-2"
                  : "md:grid-cols-1"
              }`}
            >
              {secondary.map((article, index) => (
                <div
                  key={article.id}
                  className={
                    index < secondary.length - 1
                      ? "md:border-r md:border-border-subtle md:pr-6"
                      : ""
                  }
                >
                  <div className={index > 0 ? "md:pl-6" : ""}>
                    <ArticleCard article={article} variant="text" locale={locale} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
          <div className="min-w-0">
            {latest.length > 0 ? (
              <section className="mb-8 sm:mb-10">
                <SectionHeader
                  kicker={locale === "fr" ? "Dernières nouvelles" : "Latest"}
                  title={locale === "fr" ? "Le fil de la rédaction" : "Latest from the newsroom"}
                  locale={locale}
                />
                <LatestArticlesFeed initialArticles={latest} locale={locale} />
              </section>
            ) : null}

            {editorial.length > 0 ? (
              <section className="mb-8 sm:mb-10">
                <SectionHeader
                  kicker={locale === "fr" ? "Contexte & analyse" : "Context & analysis"}
                  title={
                    locale === "fr"
                      ? "Analyses, opinions et dossiers"
                      : "Analysis, opinion and explainers"
                  }
                  locale={locale}
                />
                <div className="grid gap-7 md:grid-cols-2">
                  {editorial.map((article) => (
                    <ArticleCard key={article.id} article={article} locale={locale} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-8">
            {mostRead.length > 0 ? (
              <div className="border-t-2 border-border-strong pt-4">
                <MostReadList
                  articles={mostRead}
                  locale={locale as "fr" | "en"}
                  kicker={locale === "fr" ? "Lecture" : "Read"}
                />
              </div>
            ) : null}

            {showNewsletter ? (
              <NewsletterBlock
                locale={locale as "fr" | "en"}
                variant="sidebar"
                context="home-sidebar"
              />
            ) : null}
          </aside>
        </div>
      </div>

      {categories.length > 0 ? (
        <section className="newspaper-shell mt-8 pb-10 sm:mt-10 sm:pb-12">
          <SectionHeader
            kicker={locale === "fr" ? "Taxonomie" : "Taxonomy"}
            title={locale === "fr" ? "Rubriques principales" : "Main sections"}
            href="/categories"
            locale={locale}
          />
          <CategoryGrid variant="grid" categories={categories} locale={locale} />
        </section>
      ) : null}
    </>
  );
}
