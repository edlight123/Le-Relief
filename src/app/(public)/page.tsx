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
              <ArticleCard key={article.id} article={article} />
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
          <CategoryGrid categories={categories} />
        </section>
      )}
    </>
  );
}
