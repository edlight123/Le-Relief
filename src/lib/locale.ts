export const SUPPORTED_LOCALES = ["fr", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleParams = { locale: string };

export type PageParams = { params: Promise<LocaleParams> };

export function validateLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export async function getLocaleFromParams(
  params: Promise<LocaleParams> | LocaleParams,
): Promise<Locale> {
  const resolved = await params;
  return validateLocale(resolved.locale) ? resolved.locale : "fr";
}
