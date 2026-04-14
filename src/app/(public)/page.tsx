import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { getHaitiNews } from "@/services/news.service";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import NewsCard from "@/components/public/NewsCard";
import CategoryGrid from "@/components/public/CategoryGrid";
import type { NewsArticle } from "@/types/news";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featuredArticle: Record<string, unknown> | null = null;
  let latestArticles: Record<string, unknown>[] = [];
  let categories: (Record<string, unknown> & { _count: { articles: number } })[] = [];

  try {
    const rawFeatured = await articlesRepo.getFeaturedArticle();
    if (rawFeatured) {
      const author = rawFeatured.authorId ? await usersRepo.getUser(rawFeatured.authorId as string) : null;
      const category = rawFeatured.categoryId ? await categoriesRepo.getCategory(rawFeatured.categoryId as string) : null;
      featuredArticle = { ...rawFeatured, author, category } as Record<string, unknown>;
    }
  } catch {
    // Index may not be created yet
  }

  try {
    const rawLatest = await articlesRepo.getPublishedArticles(6);
    latestArticles = await Promise.all(
      rawLatest.map(async (article) => {
        const author = article.authorId ? await usersRepo.getUser(article.authorId as string) : null;
        const category = article.categoryId ? await categoriesRepo.getCategory(article.categoryId as string) : null;
        return { ...article, author, category } as Record<string, unknown>;
      })
    );
  } catch {
    // Index may not be created yet
  }

  try {
    categories = await categoriesRepo.getCategoriesWithCounts(true);
  } catch {
    // Fallback to empty
  }

  // Fetch live Haiti/Caribbean news
  let liveNews: NewsArticle[] = [];
  try {
    liveNews = await getHaitiNews(6);
  } catch {
    // Fallback to empty
  }

  // Split articles into headline (first 2) and recent (rest)
  const headlineArticles = latestArticles.slice(0, 2);
  const recentArticles = latestArticles.slice(2);

  return (
    <>
      <HeroSection
        article={
          featuredArticle
            ? {
                title: featuredArticle.title as string,
                slug: featuredArticle.slug as string,
                excerpt: featuredArticle.excerpt as string | null,
                coverImage: featuredArticle.coverImage as string | null,
                category: featuredArticle.category as { name: string; slug: string } | null,
                author: featuredArticle.author as { name: string | null } | null,
              }
            : undefined
        }
      />

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar - Categories */}
          {categories.length > 0 && (
            <aside className="hidden lg:flex flex-col p-8 gap-6 h-fit w-72 bg-surface-elevated rounded-lg shrink-0">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground font-headline">Catégories</h3>
                <p className="text-xs font-label text-muted uppercase tracking-widest">Parcourir</p>
              </div>
              <CategoryGrid categories={categories.map(c => ({
                name: c.name as string,
                slug: c.slug as string,
                description: c.description as string | null,
                _count: c._count as { articles: number },
              }))} />

              {/* Subscribe CTA */}
              <div className="mt-8 bg-foreground p-6 rounded-lg text-background">
                <h4 className="font-headline text-xl mb-4 italic">Édition Premium</h4>
                <Link
                  href="/signup"
                  className="block w-full bg-primary text-white py-3 rounded text-center font-label text-sm uppercase tracking-widest font-bold hover:brightness-110 transition-all"
                >
                  S&apos;abonner
                </Link>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Today's Headlines - Bento Grid */}
            {headlineArticles.length > 0 && (
              <section className="mb-12 sm:mb-20">
                <div className="flex items-center justify-between mb-6 sm:mb-10 border-b-2 border-foreground/10 pb-3 sm:pb-4">
                  <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight">Derniers Articles</h2>
                  <Link
                    href="/categories"
                    className="text-primary font-label text-xs sm:text-sm uppercase tracking-widest font-bold hover:underline underline-offset-4"
                  >
                    Voir Tout
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  {headlineArticles.map((article) => (
                    <ArticleCard
                      key={String(article.id)}
                      article={{
                        title: article.title as string,
                        slug: article.slug as string,
                        excerpt: article.excerpt as string | null,
                        coverImage: article.coverImage as string | null,
                        publishedAt: article.publishedAt as string | null,
                        author: article.author as { name: string | null } | null,
                        category: article.category as { name: string; slug: string } | null,
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Analysis - List Layout */}
            {recentArticles.length > 0 && (
              <section className="mb-12 sm:mb-20">
                <div className="flex items-center justify-between mb-6 sm:mb-10 border-b-2 border-foreground/10 pb-3 sm:pb-4">
                  <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight">Analyses Récentes</h2>
                </div>
                <div className="space-y-0">
                  {recentArticles.map((article) => (
                    <ArticleCard
                      key={String(article.id)}
                      variant="list"
                      article={{
                        title: article.title as string,
                        slug: article.slug as string,
                        excerpt: article.excerpt as string | null,
                        coverImage: article.coverImage as string | null,
                        publishedAt: article.publishedAt as string | null,
                        author: article.author as { name: string | null } | null,
                        category: article.category as { name: string; slug: string } | null,
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* No articles fallback */}
            {latestArticles.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted font-body">
                  Aucun article publié pour le moment. Revenez bientôt.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live News - Haiti & Caribbean (Full Width) */}
      {liveNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-20 border-t border-border-subtle mt-8 sm:mt-12">
          <div className="flex items-center justify-between mb-6 sm:mb-10 border-b-2 border-foreground/10 pb-3 sm:pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-coral flex items-center gap-2 font-label mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-coral opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-coral"></span>
                </span>
                Fil en Direct
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight">Actualités Haïti &amp; Caraïbes</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {liveNews.map((article, index) => (
              <NewsCard key={`${article.url}-${index}`} article={article} />
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-xs text-muted font-label">
              Propulsé par GNews · Mis à jour toutes les 30 minutes
            </p>
          </div>
        </section>
      )}

      {/* Mobile Categories (visible on small screens) */}
      {categories.length > 0 && (
        <section className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-16 sm:pb-24">
          <div className="flex items-center justify-between mb-6 sm:mb-10 border-b-2 border-foreground/10 pb-3 sm:pb-4">
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight">Catégories</h2>
          </div>
          <CategoryGrid variant="grid" categories={categories.map(c => ({
            name: c.name as string,
            slug: c.slug as string,
            description: c.description as string | null,
            _count: c._count as { articles: number },
          }))} />
        </section>
      )}
    </>
  );
}
