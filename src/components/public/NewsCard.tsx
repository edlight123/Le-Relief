import Image from "next/image";
import { format } from "date-fns";
import type { NewsArticle } from "@/types/news";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "default" | "compact";
}

export default function NewsCard({ article, variant = "default" }: NewsCardProps) {
  const date = article.publishedAt
    ? format(new Date(article.publishedAt), "MMM d, yyyy")
    : null;

  if (variant === "compact") {
    return (
      <a href={article.url} target="_blank" rel="noopener noreferrer">
        <div className="flex gap-4 p-4 bg-surface border border-border-subtle rounded-xl article-card group">
          {article.urlToImage && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={article.urlToImage}
                alt={article.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              {date && <p className="text-xs text-muted">{date}</p>}
              <span className="text-xs text-primary/60 font-medium">{article.source.name}</span>
            </div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer">
      <div className="group bg-surface border border-border-subtle rounded-2xl overflow-hidden article-card hover:border-primary/20">
        {article.urlToImage ? (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={article.urlToImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
              </svg>
            </div>
          </div>
        )}
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-coral/10 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-coral border border-accent-coral/15">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Live
            </span>
            <span className="text-[11px] text-muted font-medium">{article.source.name}</span>
          </div>
          <h3 className="font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300 text-[15px]">
            {article.title}
          </h3>
          {article.description && (
            <p className="mt-2.5 text-sm text-muted line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          )}
          <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-2.5 text-xs text-muted">
            {article.author && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-coral to-primary flex items-center justify-center text-white text-[9px] font-bold">
                  {article.author.charAt(0)}
                </div>
                <span className="font-medium text-foreground/80 line-clamp-1 max-w-[120px]">{article.author}</span>
              </div>
            )}
            {article.author && date && (
              <span className="text-border-subtle">|</span>
            )}
            {date && <span>{date}</span>}
          </div>
        </div>
      </div>
    </a>
  );
}
