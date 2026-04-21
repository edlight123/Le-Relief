"use client";

import { useState, useEffect } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface TocEntry {
  id: string;
  level: 2 | 3;
  text: string;
}

interface Props {
  toc: TocEntry[];
  locale?: Locale;
}

export default function TableOfContents({ toc, locale = "fr" }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = toc.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length < 3) return null;

  return (
    <section className="border-t border-border-subtle pt-5">
      <p className="section-kicker mb-3">{t(locale, "inThisArticle")}</p>
      <nav>
        <ol className="space-y-2">
          {toc.map(({ id, level, text }) => (
            <li key={id} className={level === 3 ? "pl-4" : ""}>
              <a
                href={`#${id}`}
                className={`block font-label text-[11px] font-bold uppercase leading-snug transition-colors ${
                  activeId === id
                    ? "text-primary"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
