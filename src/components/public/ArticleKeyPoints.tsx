import type { Locale } from "@/lib/i18n";

interface ArticleKeyPointsProps {
  // TODO(schema): persist `keyPoints: string[]` on Article model in Firestore
  // and surface from getPublicArticleBySlug. For now this component only
  // renders when the upstream page passes a non-empty array.
  points?: string[] | null;
  locale?: Locale;
}

/**
 * "À retenir" / "Key points" — short bulleted summary above the article body.
 * Renders nothing if the article has no key points yet.
 */
export default function ArticleKeyPoints({
  points,
  locale = "fr",
}: ArticleKeyPointsProps) {
  if (!points || points.length === 0) return null;

  const label = locale === "fr" ? "À retenir" : "Key points";

  return (
    <aside
      className="editorial-callout my-8"
      aria-labelledby="article-key-points"
    >
      <span
        id="article-key-points"
        className="editorial-callout-label"
      >
        {label}
      </span>
      <ul className="space-y-2.5">
        {points.map((point, index) => (
          <li
            key={index}
            className="relative pl-5 font-body text-[1.02rem] leading-relaxed text-foreground"
          >
            <span
              className="absolute left-0 top-[0.55em] h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden
            />
            {point}
          </li>
        ))}
      </ul>
    </aside>
  );
}
