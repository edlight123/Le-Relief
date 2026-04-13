import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import { getHaitiNews } from "@/services/news.service";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import NewsCard from "@/components/public/NewsCard";
import CategoryGrid from "@/components/public/CategoryGrid";
import type { NewsArticle } from "@/types/news";

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

      {/* Latest Articles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">What&apos;s New</span>
            <h2 className="text-3xl font-bold text-foreground mt-1">Latest Articles</h2>
            <div className="section-divider mt-3" />
          </div>
        </div>
        {latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
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
        ) : (
          <div className="text-center py-16">
            <p className="text-muted">
              No articles published yet. Check back soon.
            </p>
          </div>
        )}
      </section>

      {/* Live News - Haiti & Caribbean */}
      {liveNews.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-coral flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-coral opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-coral"></span>
                </span>
                Live Feed
              </span>
              <h2 className="text-3xl font-bold text-foreground mt-1">Haiti & Caribbean News</h2>
              <div className="section-divider mt-3" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveNews.map((article, index) => (
              <NewsCard key={`${article.url}-${index}`} article={article} />
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-xs text-muted">
              Powered by GNews · Updated every 30 minutes
            </p>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-teal">Browse</span>
              <h2 className="text-3xl font-bold text-foreground mt-1">Categories</h2>
              <div className="section-divider mt-3" />
            </div>
          </div>
          <CategoryGrid categories={categories.map(c => ({
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
