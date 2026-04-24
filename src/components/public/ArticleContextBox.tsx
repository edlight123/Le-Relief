import type { Locale } from "@/lib/i18n";

interface ArticleContextBoxProps {
  // TODO(schema): persist `context: string | { html: string }` on Article model.
  // Render only when context is provided by the upstream page.
  context?: string | null;
  locale?: Locale;
  title?: string;
}

/**
 * "Contexte" / "Context" — short editorial primer for readers unfamiliar
 * with the background of a story. Renders nothing without data.
 */
export default function ArticleContextBox({
  context,
  locale = "fr",
  title,
}: ArticleContextBoxProps) {
  if (!context || !context.trim()) return null;

  const label = title || (locale === "fr" ? "Contexte" : "Context");
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(context);

  return (
    <aside
      className="editorial-callout my-8"
      style={{ borderLeftColor: "var(--accent-blue)" }}
      aria-labelledby="article-context-box"
    >
      <span
        id="article-context-box"
        className="editorial-callout-label"
        style={{ color: "var(--accent-blue)" }}
      >
        {label}
      </span>
      {hasHtml ? (
        <div
          className="prose prose-sm max-w-none font-body leading-relaxed dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: context }}
        />
      ) : (
        <p className="font-body text-[1.02rem] leading-relaxed text-foreground">
          {context}
        </p>
      )}
    </aside>
  );
}
