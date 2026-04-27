import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { hrefForLocale } from "@/lib/locale-routing";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ crumbs, locale = "fr" }: { crumbs: Crumb[]; locale?: Locale }) {
  return (
    <nav aria-label={t(locale, "breadcrumb")} className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 font-label text-[11px] font-bold uppercase text-muted">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <span className="text-border-subtle" aria-hidden="true">/</span>}
              {crumb.href && !isLast ? (
                <Link href={hrefForLocale(crumb.href, locale)} className="transition-colors hover:text-primary">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? "text-foreground" : undefined} aria-current={isLast ? "page" : undefined}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
