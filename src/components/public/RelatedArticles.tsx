import ArticleCard from "@/components/public/ArticleCard";

interface RelatedArticlesProps {
  articles: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | string | null;
    author?: { name: string | null } | null;
    category?: { name: string; slug: string } | null;
  }[];
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border-subtle">
      <div className="flex items-center gap-4 mb-8">
        <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-surface border border-border-subtle rounded-full shadow-sm">
          <span className="text-base">📚</span>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground/80">
            Related Articles
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
