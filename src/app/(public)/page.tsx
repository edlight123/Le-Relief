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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Latest <span className="gradient-text">Articles</span>
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-accent-rose/20 to-transparent" />
        </div>
        {latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Categories
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border-subtle to-transparent" />
          </div>
          <CategoryGrid categories={categories} />
        </section>
      )}
    </>
  );
}
