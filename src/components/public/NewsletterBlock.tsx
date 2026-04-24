import type { Locale } from "@/lib/i18n";
import NewsletterSignup from "@/components/public/NewsletterSignup";

interface NewsletterBlockProps {
  locale?: Locale;
  variant?: "sidebar" | "wide" | "inverted";
  context?: string;
  kicker?: string;
  title?: string;
  description?: string;
}

/**
 * Editorial newsletter block. Wraps the existing NewsletterSignup form
 * (which already integrates with the /api/subscriptions backend) in a more
 * intentional, publication-style frame.
 */
export default function NewsletterBlock({
  locale = "fr",
  variant = "sidebar",
  context,
  kicker,
  title,
  description,
}: NewsletterBlockProps) {
  const defaults = {
    fr: {
      kicker: "Lettre d'information",
      title: "L'essentiel d'Haïti, chaque semaine.",
      description:
        "Une sélection éditoriale — analyses, dossiers et nouvelles vérifiées — livrée par la rédaction du Relief. Pas de bruit, pas de spam.",
    },
    en: {
      kicker: "Newsletter",
      title: "What matters in Haiti, every week.",
      description:
        "An editorial selection — analysis, explainers and verified reporting — sent by the Le Relief newsroom. No noise, no spam.",
    },
  } as const;

  const copy = defaults[locale];
  const kickerLabel = kicker || copy.kicker;
  const titleLabel = title || copy.title;
  const descLabel = description || copy.description;
  const ctxKey = context || `newsletter-${variant}`;

  if (variant === "inverted") {
    return (
      <section className="bg-foreground py-14 sm:py-20">
        <div className="newspaper-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-background/60">
              {kickerLabel}
            </p>
            <h2 className="font-headline text-3xl font-extrabold leading-tight text-background sm:text-5xl">
              {titleLabel}
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-base leading-relaxed text-background/70 sm:text-lg">
              {descLabel}
            </p>
            <div className="mx-auto mt-8 max-w-md">
              <NewsletterSignup context={ctxKey} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "wide") {
    return (
      <section className="border-y border-border-strong bg-surface-newsprint py-12 sm:py-16">
        <div className="newspaper-shell">
          <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <p className="section-kicker mb-3">{kickerLabel}</p>
              <h2 className="font-headline text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
                {titleLabel}
              </h2>
              <p className="mt-4 max-w-md font-body text-base leading-relaxed text-muted">
                {descLabel}
              </p>
            </div>
            <div>
              <NewsletterSignup context={ctxKey} />
              <p className="mt-3 font-label text-[10px] uppercase tracking-[1.2px] text-muted">
                {locale === "fr"
                  ? "Désinscription en un clic. Politique de confidentialité respectée."
                  : "One-click unsubscribe. Your privacy is respected."}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // sidebar
  return (
    <section className="border-t-2 border-border-strong pt-4">
      <p className="section-kicker mb-2">{kickerLabel}</p>
      <h3 className="font-headline text-2xl font-extrabold leading-tight text-foreground">
        {titleLabel}
      </h3>
      <p className="mt-3 font-body text-base leading-relaxed text-muted">
        {descLabel}
      </p>
      <div className="mt-5">
        <NewsletterSignup context={ctxKey} />
      </div>
    </section>
  );
}
