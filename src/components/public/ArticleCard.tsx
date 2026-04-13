import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ArticleCardProps {
  article: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | string | null;
    author?: { name: string | null } | null;
    category?: { name: string; slug: string } | null;
  };
  variant?: "default" | "compact";
}

export default function ArticleCard({
  article,
  variant = "default",
}: ArticleCardProps) {
  const date = article.publishedAt
    ? format(new Date(article.publishedAt), "d MMM yyyy", { locale: fr })
    : null;

  if (variant === "compact") {
    return (
      <Link href={`/articles/${article.slug}`}>
        <div className="flex gap-4 p-4 bg-surface border border-border-subtle rounded-xl article-card group">
          {article.coverImage && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {article.title}
            </h3>
            {date && (
              <p className="text-xs text-muted mt-1.5">{date}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="group bg-surface border border-border-subtle rounded-2xl overflow-hidden article-card hover:border-primary/20">
        {article.coverImage ? (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
          </div>
        )}
        <div className="p-5 md:p-6">
          {article.category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/8 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary border border-primary/10">
              {article.category.name}
            </span>
          )}
          <h3 className="mt-3 font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300 text-[15px]">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2.5 text-sm text-muted line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-2.5 text-xs text-muted">
            {article.author?.name && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-blue to-accent-teal flex items-center justify-center text-white text-[9px] font-bold">
                  {article.author.name.charAt(0)}
                </div>
                <span className="font-medium text-foreground/80">{article.author.name}</span>
              </div>
            )}
            {article.author?.name && date && (
              <span className="text-border-subtle">|</span>
            )}
            {date && <span>{date}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
