import { headers } from "next/headers";
import { validateLocale, type Locale } from "@/lib/locale";

/**
 * Detects the preferred locale from the Accept-Language header.
 * Falls back to "fr" when no valid locale is found.
 */
export async function detectLocale(): Promise<Locale> {
  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language") || "";
    if (!acceptLanguage) return "fr";

    const locales = acceptLanguage
      .split(",")
      .map((entry) => {
        const [tag] = entry.trim().split(";");
        return tag.split("-")[0]; // "fr-FR" → "fr"
      });

    for (const lang of locales) {
      if (validateLocale(lang)) return lang;
    }
  } catch {
    // headers() may throw during build; fall back to default.
  }
  return "fr";
}

/**
 * Redirects to the locale-specific path, detecting the user's preferred language.
 */
export async function localeRedirect(path: string) {
  const { redirect } = await import("next/navigation");
  const locale = await detectLocale();
  redirect(`/${locale}${path}`);
}