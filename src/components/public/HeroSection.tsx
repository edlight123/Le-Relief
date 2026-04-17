import Link from "next/link";
import Image from "next/image";

interface HeroSectionProps {
  article?: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    coverImageFirebaseUrl?: string | null;
    category?: { name: string; slug: string } | null;
    author?: { name: string | null } | null;
    publishedAt?: Date | string | null;
  };
}

export default function HeroSection({ article }: HeroSectionProps) {
  if (!article) {
    return (
      <section className="newspaper-shell py-10 sm:py-14">
        <div className="newsprint-panel px-4 py-10 text-center sm:px-8 sm:py-14">
          <p className="page-kicker mb-5">Journalisme indépendant</p>
          <h1 className="editorial-title mx-auto max-w-4xl text-5xl text-foreground sm:text-7xl md:text-8xl">
            Le Relief Haïti
          </h1>
          <p className="editorial-deck mx-auto mt-6 max-w-2xl font-body text-xl sm:text-2xl">
            Votre source pour des nouvelles premium, des analyses approfondies et du contenu éditorial d&apos;Haïti et d&apos;ailleurs.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/categories"
              className="border border-border-strong bg-foreground px-6 py-3 font-label text-xs font-extrabold uppercase text-background transition-colors hover:bg-primary hover:text-white"
            >
              Explorer les articles
            </Link>
            <Link
              href="/about"
              className="border border-border-strong px-6 py-3 font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:bg-surface-elevated"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const imageSrc = article.coverImageFirebaseUrl || article.coverImage;
  const date = article.publishedAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(article.publishedAt))
    : null;

  return (
    <section className="newspaper-shell py-6 sm:py-10">
      <Link href={`/articles/${article.slug}`} className="group block">
        <div className="section-rule grid gap-6 pt-5 lg:grid-cols-[1.04fr_1.35fr] lg:gap-8">
          <div className="order-2 flex flex-col justify-center border-t border-border-subtle pt-5 lg:order-1 lg:border-t-0 lg:border-r lg:pr-8">
            {article.category && (
              <p className="page-kicker mb-4">{article.category.name}</p>
            )}
            <h1 className="editorial-title text-4xl text-foreground transition-colors group-hover:text-primary sm:text-6xl lg:text-7xl">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="editorial-deck mt-5 max-w-2xl font-body text-xl sm:text-2xl">
                {article.excerpt}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3 font-label text-[11px] font-bold uppercase text-muted">
              {article.author?.name && <span>Par {article.author.name}</span>}
              {article.author?.name && date && <span className="text-border-subtle">/</span>}
              {date && <span>{date}</span>}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={article.title}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center border border-border-subtle">
                  <span className="font-label text-xs font-bold uppercase text-muted">
                    Le Relief
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 border-b border-border-subtle pb-3 font-label text-[10px] uppercase text-muted">
              À la une
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
