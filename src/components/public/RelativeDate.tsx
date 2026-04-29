"use client";

import { useEffect, useState } from "react";
import { formatRelativeDate } from "@/lib/i18n";

interface RelativeDateProps {
  rawDate: Date | string;
  staticDate: string;
  locale: "fr" | "en";
  className?: string;
}

/**
 * Renders a static date string on the server (and during first hydration),
 * then swaps it for a relative label ("2h ago") on the client after mount.
 * This prevents React hydration mismatch errors (#418) caused by
 * time-dependent output differing between server and client renders.
 */
export default function RelativeDate({
  rawDate,
  staticDate,
  locale,
  className,
}: RelativeDateProps) {
  const [label, setLabel] = useState<string>(staticDate);

  useEffect(() => {
    setLabel(formatRelativeDate(rawDate, locale));
    // Optionally refresh every minute so "2m ago" stays accurate
    const id = setInterval(() => {
      setLabel(formatRelativeDate(rawDate, locale));
    }, 60_000);
    return () => clearInterval(id);
  }, [rawDate, locale]);

  return (
    <time
      dateTime={new Date(rawDate).toISOString()}
      title={staticDate}
      className={className}
    >
      {label}
    </time>
  );
}
