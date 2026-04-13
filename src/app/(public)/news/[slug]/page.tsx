import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getNewsArticleBySlug, getHaitiNews, encodeNewsSlug, fetchFullArticleContent } from "@/services/news.service";
import NewsCard from "@/components/public/NewsCard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await getNewsArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Le Relief Haïti`,
    description: article.description || "",
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getNewsArticleBySlug(slug);

  if (!article) notFound();

  const date = article.publishedAt
    ? format(new Date(article.publishedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
    : null;

  // Get related news for sidebar
  let relatedNews = await getHaitiNews(10);
  relatedNews = relatedNews.filter((a) => a.url !== article.url).slice(0, 4);

  // Build summary paragraphs — scrape the full article for detailed content
  const scrapedParagraphs = await fetchFullArticleContent(article.url);

  let contentParagraphs: string[];

  if (scrapedParagraphs.length >= 2) {
    // We have rich scraped content — use it
    contentParagraphs = scrapedParagraphs;
  } else {
    // Fallback: expand from GNews description + content
    contentParagraphs = [];
    if (article.description) contentParagraphs.push(article.description);
    if (article.content) {
      const cleaned = article.content.replace(/\[\d+ chars\]$/, "").trim();
      if (cleaned && cleaned !== article.description) {
        contentParagraphs.push(cleaned);
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Article */}
        <article className="lg:col-span-2">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Actualités</span>
          </nav>

          {/* Live badge + source */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-coral/10 text-xs font-semibold uppercase tracking-[0.12em] text-accent-coral border border-accent-coral/15">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-coral opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-coral"></span>
              </span>
              En Direct
            </span>
            <span className="text-xs text-muted font-medium">{article.source.name}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="mt-4 flex items-center gap-3 text-sm text-muted">
            {article.author && (
              <span>Par <span className="font-medium text-foreground/80">{article.author}</span></span>
            )}
            {article.author && date && <span>·</span>}
            {date && <time>{date}</time>}
          </div>

          {/* Cover Image */}
          {article.urlToImage && (
            <div className="mt-8 relative aspect-[16/9] rounded-2xl overflow-hidden border border-border-subtle">
              <Image
                src={article.urlToImage}
                alt={article.title}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <div className="mt-8 max-w-none">
            {/* Lead paragraph — larger text */}
            {contentParagraphs.length > 0 && (
              <p className="text-lg md:text-xl leading-relaxed text-foreground/90 font-medium mb-6">
                {contentParagraphs[0]}
              </p>
            )}

            {/* Separator */}
            {contentParagraphs.length > 1 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-border-subtle" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <div className="h-px flex-1 bg-border-subtle" />
              </div>
            )}

            {/* Body paragraphs */}
            <div className="space-y-5 text-base leading-[1.85] text-foreground/80">
              {contentParagraphs.slice(1).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Key points box — if we have enough content */}
            {contentParagraphs.length >= 4 && (
              <div className="mt-10 p-6 rounded-2xl bg-primary/[0.03] border border-primary/10">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                  Points Clés
                </h3>
                <ul className="space-y-3">
                  {contentParagraphs.slice(0, 3).map((p, i) => {
                    // Extract first sentence as a key point
                    const sentence = p.split(/[.!?]/)[0]?.trim();
                    if (!sentence || sentence.length < 20) return null;
                    return (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground/75 leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {sentence.length > 150 ? sentence.slice(0, 150) + "…" : sentence}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Source Credit */}
          <div className="mt-10 p-6 rounded-2xl bg-surface-elevated border border-border-subtle">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted leading-relaxed">
                  Cet article est un résumé automatique basé sur les informations publiées par{" "}
                  <span className="font-semibold text-foreground">{article.source.name}</span>.
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Lire l&apos;article complet sur {article.source.name}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </article>

        {/* Sidebar - Related News */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-coral flex items-center gap-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-coral opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-coral"></span>
              </span>
              Autres Actualités
            </h3>
            <div className="space-y-3">
              {relatedNews.map((news, i) => (
                <NewsCard key={`${news.url}-${i}`} article={news} variant="compact" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
