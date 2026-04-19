import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import Breadcrumb from "@/components/public/Breadcrumb";
import { getCategoryPageContent } from "@/lib/public-content";

export const revalidate = 120;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getCategoryPageContent(slug);
  if (!content) return {};

  return {
    title: `${content.category.name} | Le Relief Haïti`,
    description:
      content.category.description ||
      `Articles, analyses et dossiers dans la rubrique ${content.category.name}.`,
    alternates: {
      canonical: `/categories/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const content = await getCategoryPageContent(slug);
  if (!content) notFound();

  const { category, featured, articles } = content;

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <Breadcrumb
        crumbs={[
          { label: "Accueil", href: "/" },
          { label: "Rubriques", href: "/categories" },
          { label: category.name },
        ]}
      />
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Rubrique</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          {category.name}
        </h1>

        {category.description ? (
          <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
            {category.description}
          </p>
        ) : null}
      </header>

      {featured ? (
        <section className="mb-12">
          <div className="mb-5 border-t-2 border-border-strong pt-3">
            <p className="section-kicker mb-2">Article vedette</p>
            <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground">
              À lire dans cette rubrique
            </h2>
          </div>
          <div className="max-w-4xl">
            <ArticleCard article={featured} variant="list" />
          </div>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section>
          <div className="mb-5 border-t border-border-strong pt-3">
            <p className="section-kicker mb-2">Archives</p>
            <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground">
              Tous les articles
            </h2>
          </div>
          <LatestArticlesFeed
            initialArticles={articles}
            categoryId={category.id}
            variant="grid"
          />
        </section>
      ) : null}

      {!featured && articles.length === 0 ? (
        <p className="border-t border-border-subtle py-8 font-body text-lg text-muted">
          Aucun article publié dans cette rubrique pour le moment.
        </p>
      ) : null}
    </div>
  );
}
