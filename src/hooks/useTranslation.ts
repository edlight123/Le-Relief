"use client";

import { useLocaleContext } from "@/hooks/useLocaleContext";
import { t, type I18nKey } from "@/lib/i18n";

export function useTranslation() {
  const locale = useLocaleContext();
  return (key: I18nKey) => t(locale, key);
}
