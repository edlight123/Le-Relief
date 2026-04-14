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
  variant?: "default" | "compact" | "list";
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
        <div className="flex gap-4 p-4 bg-surface border border-border-subtle rounded-lg article-card group">
          {article.coverImage && (
            <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200 font-headline">
              {article.title}
            </h3>
            {date && (
              <p className="text-xs text-muted mt-1.5 font-label">{date}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  /* List variant - horizontal card like "Recent Analysis" */
  if (variant === "list") {
    return (
      <Link href={`/articles/${article.slug}`}>
        <div className="group flex flex-col sm:flex-row gap-4 sm:gap-8 py-6 sm:py-8 border-b border-border-subtle last:border-b-0 hover:bg-surface-elevated transition-colors px-3 sm:px-4 -mx-3 sm:-mx-4 rounded">
          {article.coverImage && (
            <div className="w-full sm:w-48 h-40 sm:h-32 shrink-0 overflow-hidden rounded-sm sm:rounded-none">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill={false}
                width={192}
                height={128}
                className="w-full h-full object-cover img-grayscale"
              />
            </div>
          )}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              {article.category && (
                <span className="text-primary font-label text-[10px] font-bold uppercase tracking-[0.2em]">
                  {article.category.name}
                </span>
              )}
              {date && (
                <span className="text-muted/50 font-label text-[10px] uppercase">{date}</span>
              )}
            </div>
            <h3 className="font-headline text-lg sm:text-xl font-bold leading-tight group-hover:text-primary transition-colors mb-2">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="font-body text-sm text-muted line-clamp-2">
                {article.excerpt}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  /* Default variant - bento grid card like "Today's Headlines" */
  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="group cursor-pointer">
        <div className="relative overflow-hidden aspect-[16/10] mb-6">
          {article.coverImage ? (
            <>
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {article.category && (
                <span className="absolute top-0 left-0 bg-primary text-white px-3 py-1 font-label text-[10px] uppercase tracking-widest">
                  {article.category.name}
                </span>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
              {article.category && (
                <span className="absolute top-0 left-0 bg-primary text-white px-3 py-1 font-label text-[10px] uppercase tracking-widest">
                  {article.category.name}
                </span>
              )}
              <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
            </div>
          )}
        </div>
        <h3 className="font-headline text-2xl font-bold leading-snug group-hover:text-primary transition-colors mb-3">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="font-body text-muted text-sm line-clamp-3 mb-4">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-4 font-label text-[10px] text-muted/70 uppercase tracking-widest">
          {article.author?.name && <span>{article.author.name}</span>}
          {article.author?.name && date && (
            <span className="w-1 h-1 rounded-full bg-foreground/20" />
          )}
          {date && <span>{date}</span>}
        </div>
      </div>
    </Link>
  );
}
