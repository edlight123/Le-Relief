import Link from "next/link";
import clsx from "clsx";
import { hrefForLocale } from "@/lib/locale-routing";
import RelativeDate from "@/components/public/RelativeDate";

interface MetadataRowProps {
  author?: { name: string; id?: string | null } | null;
  date?: string | null;
  /** Raw ISO date string — used to compute relative time label */
  rawDate?: Date | string | null;
  readingTime?: number | null;
  language?: "fr" | "en" | null;
  size?: "sm" | "md";
  bordered?: boolean;
  className?: string;
}

export default function MetadataRow({
  author,
  date,
  rawDate,
  readingTime,
  language,
  size = "sm",
  bordered = false,
  className,
}: MetadataRowProps) {
  const textSize = size === "md" ? "text-[12px]" : "text-[11px]";
  const baseClass = clsx(
    "flex flex-wrap items-center gap-2 font-label font-bold uppercase text-muted tracking-[1px]",
    textSize,
    bordered && "border-y border-border-subtle py-3",
    className,
  );

  const Divider = () => <span className="text-border-subtle">/</span>;
  const locale = language === "en" ? "en" : "fr";

  const items: React.ReactNode[] = [];

  if (author?.name) {
    items.push(
      author.id ? (
        <Link
          key="author"
          href={hrefForLocale(`/auteurs/${author.id}`, locale)}
          className="transition-colors hover:text-primary"
        >
          {author.name}
        </Link>
      ) : (
        <span key="author">{author.name}</span>
      ),
    );
  }

  if (date || rawDate) {
    const dateLocale = language === "en" ? "en" : "fr";
    if (rawDate && date) {
      items.push(
        <RelativeDate
          key="date"
          rawDate={rawDate}
          staticDate={date}
          locale={dateLocale}
          className="font-[family-name:var(--font-mono)]"
        />,
      );
    } else {
      items.push(
        <time
          key="date"
          className="font-[family-name:var(--font-mono)]"
        >
          {date}
        </time>,
      );
    }
  }

  if (readingTime) {
    items.push(
      <span key="reading" className="font-[family-name:var(--font-mono)]">
        {readingTime} {language === "en" ? "min read" : "min de lecture"}
      </span>,
    );
  }

  if (language === "en") {
    items.push(
      <span key="lang" className="text-primary">
        English
      </span>,
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={baseClass}>
      {items.map((item, i) => (
        <span key={i} className="contents">
          {i > 0 && <Divider />}
          {item}
        </span>
      ))}
    </div>
  );
}
