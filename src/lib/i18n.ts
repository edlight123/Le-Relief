import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";

export type Locale = "fr" | "en";

const messages = {
  fr: {
    by: "Par",
    minRead: "min de lecture",
    copyLink: "Copier le lien",
    copied: "Lien copié !",
    inThisArticle: "Dans cet article",
    relatedKicker: "Lecture suivante",
    relatedTitle: "Articles connexes",
    loadMore: "Charger plus d'articles",
    loading: "Chargement…",
    allShown: "Tous les articles sont affichés.",
    newsletterPlaceholder: "Adresse courriel",
    newsletterAria: "S'inscrire à la lettre",
    alreadySubscribed: "Vous êtes déjà inscrit à la lettre.",
    subscribeFailed: "Échec de l'inscription",
    networkError: "Erreur réseau. Réessayez.",
    newsletterConfirmed: "Inscription confirmée.",
    breadcrumb: "Fil d'Ariane",
    home: "Accueil",
    search: "Recherche",
    about: "À propos",
    contact: "Contact",
    categories: "Catégories",
  },
  en: {
    by: "By",
    minRead: "min read",
    copyLink: "Copy link",
    copied: "Link copied!",
    inThisArticle: "In this article",
    relatedKicker: "Continue reading",
    relatedTitle: "Related articles",
    loadMore: "Load more articles",
    loading: "Loading…",
    allShown: "All articles are shown.",
    newsletterPlaceholder: "Email address",
    newsletterAria: "Subscribe to the newsletter",
    alreadySubscribed: "You're already subscribed to the newsletter.",
    subscribeFailed: "Subscription failed",
    networkError: "Network error. Try again.",
    newsletterConfirmed: "Subscription confirmed.",
    breadcrumb: "Breadcrumb",
    home: "Home",
    search: "Search",
    about: "About",
    contact: "Contact",
    categories: "Categories",
  },
} as const;

export type I18nKey = keyof (typeof messages)["fr"];

export function t(locale: Locale, key: I18nKey): string {
  return messages[locale]?.[key] ?? messages.fr[key];
}

export function formatArticleDate(date: Date | string, locale: Locale): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, locale === "en" ? "MMM d, yyyy" : "d MMM yyyy", {
    locale: locale === "en" ? enUS : fr,
  });
}

/**
 * Returns a short relative time string for recent content (< 7 days),
 * falling back to the full formatted date for older articles.
 * e.g. "il y a 2h", "3d ago", "12 avr. 2026"
 */
export function formatRelativeDate(
  date: Date | string,
  locale: Locale,
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - value.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return locale === "en" ? "just now" : "à l'instant";
  if (diffMins < 60)
    return locale === "en" ? `${diffMins}m ago` : `il y a ${diffMins}m`;
  if (diffHours < 24)
    return locale === "en" ? `${diffHours}h ago` : `il y a ${diffHours}h`;
  if (diffDays < 7)
    return locale === "en" ? `${diffDays}d ago` : `il y a ${diffDays}j`;

  return formatArticleDate(value, locale);
}
