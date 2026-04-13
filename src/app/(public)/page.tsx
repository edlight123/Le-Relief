import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import CategoryGrid from "@/components/public/CategoryGrid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rawFeatured = await articlesRepo.getFeaturedArticle();
  let featuredArticle: Record<string, unknown> | null = null;
  if (rawFeatured) {
    const author = rawFeatured.authorId ? await usersRepo.getUser(rawFeatured.authorId as string) : null;
    const category = rawFeatured.categoryId ? await categoriesRepo.getCategory(rawFeatured.categoryId as string) : null;
    featuredArticle = { ...rawFeatured, author, category } as Record<string, unknown>;
  }

  const rawLatest = await articlesRepo.getPublishedArticles(6);
  const latestArticles = await Promise.all(
    rawLatest.map(async (article) => {
      const author = article.authorId ? await usersRepo.getUser(article.authorId as string) : null;
      const category = article.categoryId ? await categoriesRepo.getCategory(article.categoryId as string) : null;
      return { ...article, author, category } as Record<string, unknown>;
    })
  );

  const categories = await categoriesRepo.getCategoriesWithCounts(true);

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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Latest Articles</h2>
            <div className="section-divider mt-2" />
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

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Categories</h2>
              <div className="section-divider mt-2" />
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
