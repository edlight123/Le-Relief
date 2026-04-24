import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface SectionHeaderProps {
  kicker: string;
  title: string;
  href?: string;
  ctaLabel?: string;
  locale?: Locale;
  variant?: "default" | "subtle";
}

/**
 * Editorial section heading with kicker, large headline and optional "see all" link.
 * Replaces the inline SectionHeader duplicated across pages.
 */
export default function SectionHeader({
  kicker,
  title,
  href,
  ctaLabel,
  locale = "fr",
  variant = "default",
}: SectionHeaderProps) {
  const cta = ctaLabel || (locale === "fr" ? "Tout voir" : "See all");
  return (
    <div
      className={`mb-4 flex items-end justify-between pt-2 sm:mb-5 ${
        variant === "subtle"
          ? "border-t border-border-subtle"
          : "border-t-2 border-border-strong"
      }`}
    >
      <div>
        <p className="section-kicker mb-1.5 tracking-[1px]">{kicker}</p>
        <h2 className="font-headline text-2xl font-extrabold leading-none text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:text-primary sm:inline-flex"
        >
          {cta}
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}
