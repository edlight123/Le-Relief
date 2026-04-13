import { db } from "@/lib/db";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import CategoryGrid from "@/components/public/CategoryGrid";

export default async function HomePage() {
  const featuredArticle = await db.article.findFirst({
    where: { status: "published", featured: true },
    include: { author: true, category: true },
    orderBy: { publishedAt: "desc" },
  });

  const latestArticles = await db.article.findMany({
    where: { status: "published" },
    include: { author: true, category: true },
    orderBy: { publishedAt: "desc" },
    take: 6,
  });

  const categories = await db.category.findMany({
    include: { _count: { select: { articles: { where: { status: "published" } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <HeroSection
        article={
          featuredArticle
            ? {
                title: featuredArticle.title,
                slug: featuredArticle.slug,
                excerpt: featuredArticle.excerpt,
                coverImage: featuredArticle.coverImage,
                category: featuredArticle.category,
                author: featuredArticle.author,
              }
            : undefined
        }
      />

      {/* Latest Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">
          Latest Articles
        </h2>
        {latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400">
            No articles published yet. Check back soon.
          </p>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">
            Categories
          </h2>
          <CategoryGrid categories={categories} />
        </section>
      )}
    </>
  );
}
