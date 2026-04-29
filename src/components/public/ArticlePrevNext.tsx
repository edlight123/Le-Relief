import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hrefForLocale } from "@/lib/locale-routing";
import type { Locale } from "@/lib/i18n";

interface AdjacentArticle {
  slug: string;
  title: string;
  category?: { name: string } | null;
}

interface Props {
  prev: AdjacentArticle | null;
  next: AdjacentArticle | null;
  locale: Locale;
}

export default function ArticlePrevNext({ prev, next, locale }: Props) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label={locale === "fr" ? "Navigation entre articles" : "Article navigation"}
      className="mt-10 grid grid-cols-2 gap-4 border-t-2 border-border-strong pt-6"
    >
      <div>
        {prev && (
          <Link
            href={hrefForLocale(`/articles/${prev.slug}`, locale)}
            className="group flex flex-col gap-1"
          >
            <span className="flex items-center gap-1 font-label text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted transition-colors group-hover:text-primary">
              <ChevronLeft className="h-3 w-3" aria-hidden />
              {locale === "fr" ? "Précédent" : "Previous"}
            </span>
            {prev.category && (
              <span className="font-label text-[10px] font-bold uppercase tracking-wider text-primary">
                {prev.category.name}
              </span>
            )}
            <span className="line-clamp-2 font-headline text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {prev.title}
            </span>
          </Link>
        )}
      </div>

      <div className="text-right">
        {next && (
          <Link
            href={hrefForLocale(`/articles/${next.slug}`, locale)}
            className="group flex flex-col items-end gap-1"
          >
            <span className="flex items-center gap-1 font-label text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted transition-colors group-hover:text-primary">
              {locale === "fr" ? "Suivant" : "Next"}
              <ChevronRight className="h-3 w-3" aria-hidden />
            </span>
            {next.category && (
              <span className="font-label text-[10px] font-bold uppercase tracking-wider text-primary">
                {next.category.name}
              </span>
            )}
            <span className="line-clamp-2 font-headline text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {next.title}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
