import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { encodeNewsSlug } from "@/services/news.service";
import type { NewsArticle } from "@/types/news";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "default" | "compact";
}

export default function NewsCard({ article, variant = "default" }: NewsCardProps) {
  const date = article.publishedAt
    ? format(new Date(article.publishedAt), "d MMM yyyy", { locale: fr })
    : null;
  const href = `/news/${encodeNewsSlug(article.url)}`;

  if (variant === "compact") {
    return (
      <Link href={href}>
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
      </Link>
    );
  }

  return (
    <Link href={href}>
      <div className="group cursor-pointer">
        <div className="relative overflow-hidden aspect-[16/10] mb-6">
          {article.urlToImage ? (
            <>
              <Image
                src={article.urlToImage}
                alt={article.title}
                fill
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
              <span className="absolute top-0 left-0 bg-accent-coral text-white px-3 py-1 font-label text-[10px] uppercase tracking-widest">
                En Direct
              </span>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
              <span className="absolute top-0 left-0 bg-accent-coral text-white px-3 py-1 font-label text-[10px] uppercase tracking-widest">
                En Direct
              </span>
              <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
                </svg>
              </div>
            </div>
          )}
        </div>
        <h3 className="font-headline text-xl font-bold leading-snug group-hover:text-primary transition-colors mb-3 line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="font-body text-muted text-sm line-clamp-3 mb-4">
            {article.description}
          </p>
        )}
        <div className="flex items-center gap-4 font-label text-[10px] text-muted/70 uppercase tracking-widest">
          <span>{article.source.name}</span>
          {date && (
            <>
              <span className="w-1 h-1 rounded-full bg-foreground/20" />
              <span>{date}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
