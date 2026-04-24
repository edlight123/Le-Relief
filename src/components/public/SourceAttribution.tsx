import type { Locale } from "@/lib/i18n";

export interface ArticleSource {
  label: string;
  url?: string | null;
  publisher?: string | null;
}

interface SourceAttributionProps {
  // TODO(schema): persist `sources: ArticleSource[]` on Article model.
  // Component renders only when sources are provided.
  sources?: ArticleSource[] | null;
  locale?: Locale;
}

/**
 * Source / attribution block — credits external reporting and references
 * cited in the article. Premium publications surface this transparently.
 */
export default function SourceAttribution({
  sources,
  locale = "fr",
}: SourceAttributionProps) {
  if (!sources || sources.length === 0) return null;

  const label = locale === "fr" ? "Sources" : "Sources";
  const sub =
    locale === "fr"
      ? "Références citées dans cet article."
      : "References cited in this article.";

  return (
    <section
      className="mt-12 border-t border-border-strong pt-6"
      aria-labelledby="article-sources"
    >
      <p className="section-kicker mb-2" id="article-sources">
        {label}
      </p>
      <p className="mb-4 font-label text-[11px] font-semibold uppercase tracking-[1px] text-muted">
        {sub}
      </p>
      <ol className="space-y-3 font-body text-sm leading-relaxed text-muted">
        {sources.map((source, index) => (
          <li
            key={index}
            className="grid grid-cols-[1.75rem_1fr] gap-3"
          >
            <span className="font-[family-name:var(--font-mono)] text-xs font-bold text-muted">
              [{index + 1}]
            </span>
            <span>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ink-link text-foreground"
                >
                  {source.label}
                </a>
              ) : (
                <span className="text-foreground">{source.label}</span>
              )}
              {source.publisher ? (
                <span className="ml-2 text-muted">— {source.publisher}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
