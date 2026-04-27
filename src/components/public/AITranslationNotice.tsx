import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { hrefForLocale } from "@/lib/locale-routing";

interface AITranslationNoticeProps {
  locale: Locale;
  /** When provided and locale === "en", links back to the FR authoritative version. */
  alternateLanguageSlug?: string | null;
  className?: string;
}

/**
 * Calm, credible transparency notice about AI-assisted translation.
 * - English page : "Translated from French — AI-assisted, reviewed by editors."
 * - French page  : "Version française originale — source de référence."
 *
 * Links to the editorial AI translation policy page (/traduction-ia) and,
 * when applicable, to the original French article.
 */
export default function AITranslationNotice({
  locale,
  alternateLanguageSlug,
  className,
}: AITranslationNoticeProps) {
  const baseClass = `ai-translation-notice ${className ?? ""}`.trim();

  if (locale === "en") {
    return (
      <p
        className={baseClass}
        role="note"
        aria-label="Translation transparency"
      >
        <span className="font-semibold text-foreground">
          Translated from French
        </span>{" "}
        — AI-assisted and reviewed by the editorial team. The French version is
        authoritative.{" "}
        {alternateLanguageSlug ? (
          <>
            <Link
              href={hrefForLocale(`/articles/${alternateLanguageSlug}`, "fr")}
              className="ink-link text-foreground"
            >
              Read the original
            </Link>
            {" · "}
          </>
        ) : null}
        <Link href={hrefForLocale("/traduction-ia", "en")} className="ink-link text-foreground">
          About our translation policy
        </Link>
      </p>
    );
  }

  return (
    <p
      className={baseClass}
      role="note"
      aria-label="Transparence linguistique"
    >
      <span className="font-semibold text-foreground">
        Version française originale
      </span>{" "}
      — source de référence du Relief.{" "}
      <Link href={hrefForLocale("/traduction-ia", "fr")} className="ink-link text-foreground">
        Notre politique de traduction
      </Link>
    </p>
  );
}
