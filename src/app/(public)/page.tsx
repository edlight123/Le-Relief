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

      {/* Featured Topics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-4">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "Business", emoji: "💼" },
            { label: "Technology", emoji: "⚡" },
            { label: "Culture", emoji: "🎭" },
            { label: "Science", emoji: "🔬" },
            { label: "World", emoji: "🌍" },
          ].map((topic) => (
            <span
              key={topic.label}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border-subtle rounded-full text-sm font-medium text-foreground/70 shadow-sm hover:border-primary/40 hover:text-primary transition-all duration-300 cursor-default"
            >
              <span>{topic.emoji}</span>
              {topic.label}
            </span>
          ))}
        </div>
      </section>

      {/* Latest Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-surface border border-border-subtle rounded-full shadow-sm">
            <span className="text-base">📰</span>
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground/80">
              Latest Articles
            </h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        {latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-4xl mb-4 block">✨</span>
            <p className="text-foreground/50">
              No articles published yet. Check back soon.
            </p>
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-surface border border-border-subtle rounded-full shadow-sm">
              <span className="text-base">🗂️</span>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground/80">
                Explore Categories
              </h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          <CategoryGrid categories={categories} />
        </section>
      )}
    </>
  );
}
