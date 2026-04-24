import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale";

export type InstitutionalPageSlug =
  | "about"
  | "politique-editoriale"
  | "corrections"
  | "traduction-ia"
  | "privacy";

export interface InstitutionalSection {
  /** Stable slug used as anchor id (eg. "standards") */
  id: string;
  /** Section heading shown in main column and TOC */
  title: string;
  /** Section body — paragraphs, lists, etc. */
  body: ReactNode;
}

interface InstitutionalPageShellProps {
  locale: Locale;
  slug: InstitutionalPageSlug;
  kicker: string;
  title: ReactNode;
  deck?: ReactNode;
  sections: InstitutionalSection[];
  /** ISO date string or human-readable label */
  updatedAt?: string;
}

interface NavItem {
  slug: InstitutionalPageSlug;
  href: string;
  label: string;
  blurb: string;
}

function buildNav(locale: Locale): NavItem[] {
  const base = `/${locale}`;
  if (locale === "en") {
    return [
      {
        slug: "about",
        href: `${base}/about`,
        label: "About",
        blurb: "Mission and editorial approach.",
      },
      {
        slug: "politique-editoriale",
        href: `${base}/politique-editoriale`,
        label: "Editorial policy",
        blurb: "Standards, formats and independence.",
      },
      {
        slug: "corrections",
        href: `${base}/corrections`,
        label: "Corrections",
        blurb: "How we acknowledge and fix errors.",
      },
      {
        slug: "traduction-ia",
        href: `${base}/traduction-ia`,
        label: "AI translation",
        blurb: "How we translate, with human review.",
      },
      {
        slug: "privacy",
        href: `${base}/privacy`,
        label: "Privacy",
        blurb: "What we collect and why.",
      },
    ];
  }
  return [
    {
      slug: "about",
      href: `${base}/about`,
      label: "À propos",
      blurb: "Mission et approche éditoriale.",
    },
    {
      slug: "politique-editoriale",
      href: `${base}/politique-editoriale`,
      label: "Politique éditoriale",
      blurb: "Standards, formats et indépendance.",
    },
    {
      slug: "corrections",
      href: `${base}/corrections`,
      label: "Corrections",
      blurb: "Comment nous corrigeons nos erreurs.",
    },
    {
      slug: "traduction-ia",
      href: `${base}/traduction-ia`,
      label: "Traduction IA",
      blurb: "Traduction assistée, revue par la rédaction.",
    },
    {
      slug: "privacy",
      href: `${base}/privacy`,
      label: "Confidentialité",
      blurb: "Ce que nous collectons et pourquoi.",
    },
  ];
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function InstitutionalPageShell({
  locale,
  slug,
  kicker,
  title,
  deck,
  sections,
  updatedAt,
}: InstitutionalPageShellProps) {
  const nav = buildNav(locale);
  const isFr = locale === "fr";
  const contactHref = `/${locale}/contact`;
  const altLocale: Locale = isFr ? "en" : "fr";
  const altHref = `/${altLocale}/${slug}`;

  const tocLabel = isFr ? "Sur cette page" : "On this page";
  const alsoReadLabel = isFr ? "Pages institutionnelles" : "Institutional pages";
  const updatedLabel = isFr ? "Mise à jour" : "Last updated";
  const contactKicker = isFr ? "Une question ?" : "A question?";
  const contactCta = isFr ? "Écrire à la rédaction" : "Write to the newsroom";
  const altLabel = isFr ? "Read in English" : "Lire en français";

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      {/* Masthead */}
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">{kicker}</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          {title}
        </h1>
        {deck ? (
          <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
            {deck}
          </p>
        ) : null}
      </header>

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
        {/* Main: numbered, hairline-separated sections */}
        <div className="min-w-0">
          <ol className="list-none space-y-12 p-0">
            {sections.map((section, index) => (
              <li
                key={section.id}
                id={section.id}
                className="policy-section scroll-mt-24"
              >
                <div className="mb-4 flex items-baseline gap-4 border-t border-border-strong pt-5">
                  <span className="policy-section-number font-mono text-[11px] font-bold uppercase tracking-[2px] text-primary">
                    {pad2(index + 1)}
                  </span>
                  <h2 className="m-0 flex-1 font-headline text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    {section.title}
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary [&>p:first-of-type]:mt-0 [&>p:first-of-type::first-letter]:!float-none [&>p:first-of-type::first-letter]:!text-[inherit] [&>p:first-of-type::first-letter]:!font-[inherit]">
                  {section.body}
                </div>
              </li>
            ))}
          </ol>

          {updatedAt ? (
            <p className="mt-12 border-t border-border-subtle pt-4 font-mono text-[11px] uppercase tracking-[1.6px] text-muted">
              {updatedLabel} · {updatedAt}
            </p>
          ) : null}
        </div>

        {/* Aside: TOC + related + contact */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-8 border-t-2 border-border-strong pt-5 lg:border-t-0 lg:pt-0">
            {/* TOC */}
            {sections.length > 1 ? (
              <nav aria-label={tocLabel}>
                <h3 className="mb-3 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-primary">
                  {tocLabel}
                </h3>
                <ol className="m-0 list-none space-y-2 p-0">
                  {sections.map((section, index) => (
                    <li key={section.id} className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] tabular-nums text-muted">
                        {pad2(index + 1)}
                      </span>
                      <a
                        href={`#${section.id}`}
                        className="ink-link font-body text-[14px] leading-snug text-foreground"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}

            {/* Related institutional pages */}
            <nav aria-label={alsoReadLabel}>
              <h3 className="mb-3 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-primary">
                {alsoReadLabel}
              </h3>
              <ul className="m-0 list-none space-y-3 p-0">
                {nav.map((item) => {
                  const isActive = item.slug === slug;
                  return (
                    <li key={item.slug}>
                      {isActive ? (
                        <div
                          aria-current="page"
                          className="border-l-2 border-primary pl-3"
                        >
                          <p className="font-headline text-[15px] font-bold text-foreground">
                            {item.label}
                          </p>
                          <p className="mt-0.5 font-body text-[13px] italic leading-snug text-muted">
                            {item.blurb}
                          </p>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="block border-l-2 border-transparent pl-3 transition-colors hover:border-border-strong"
                        >
                          <p className="font-headline text-[15px] font-bold text-foreground underline decoration-1 underline-offset-[3px]">
                            {item.label}
                          </p>
                          <p className="mt-0.5 font-body text-[13px] italic leading-snug text-muted">
                            {item.blurb}
                          </p>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Contact CTA */}
            <div className="newsprint-panel p-5">
              <p className="font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-primary">
                {contactKicker}
              </p>
              <p className="mt-2 font-body text-[14px] italic leading-relaxed text-foreground">
                {isFr
                  ? "Pour signaler une erreur, proposer un sujet ou poser une question éditoriale."
                  : "To report an error, pitch a story or ask an editorial question."}
              </p>
              <Link
                href={contactHref}
                className="ink-link mt-3 inline-block font-label text-[12px] font-extrabold uppercase tracking-[1.4px] text-foreground"
              >
                {contactCta} →
              </Link>
            </div>

            {/* Locale switch */}
            <p className="font-body text-[13px] italic text-muted">
              <Link href={altHref} className="ink-link text-foreground">
                {altLabel}
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
