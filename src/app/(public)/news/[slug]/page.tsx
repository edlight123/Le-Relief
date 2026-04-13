import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getNewsArticleBySlug, getHaitiNews, encodeNewsSlug } from "@/services/news.service";
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

  // Build summary paragraphs from description + content
  const summaryParts: string[] = [];
  if (article.description) summaryParts.push(article.description);
  if (article.content) {
    // GNews content often ends with "[XXX chars]" — remove that
    const cleaned = article.content.replace(/\[\d+ chars\]$/, "").trim();
    if (cleaned && cleaned !== article.description) {
      summaryParts.push(cleaned);
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

          {/* Summary Content */}
          <div className="mt-8 prose prose-lg dark:prose-invert max-w-none">
            {summaryParts.map((paragraph, i) => (
              <p key={i} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
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
