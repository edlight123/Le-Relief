const DEFAULT_APP_URL = "http://localhost:3000";

function normalizeCandidateUrl(value?: string) {
  const token = value?.split(/\s+/)[0]?.replaceAll('"', "").trim();
  if (!token) return null;

  const withProtocol = token.startsWith("http://") || token.startsWith("https://")
    ? token
    : `https://${token}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function getNormalizedAppUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    DEFAULT_APP_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCandidateUrl(candidate);
    if (normalized) return normalized;
  }

  return DEFAULT_APP_URL;
}

export const siteConfig = {
  name: "Le Relief",
  description: "Publication numérique haïtienne, française d'abord et ouverte au lectorat international",
  url: getNormalizedAppUrl(),
  locale: "fr-FR",
  socials: {
    instagram: "https://www.instagram.com/lereliefhaiti",
    facebook: "",
    x: "https://x.com/lereliefhaiti",
  },
  nav: {
    public: [
      { label: "Accueil", href: "/" },
      { label: "Catégories", href: "/categories" },
      { label: "Recherche", href: "/search" },
      { label: "À propos", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    dashboard: [
      { label: "Tableau de Bord", href: "/dashboard" },
      { label: "Une", href: "/dashboard/homepage" },
      { label: "Articles", href: "/dashboard/articles" },
      { label: "Nouvel Article", href: "/dashboard/articles/new" },
      { label: "Médias", href: "/dashboard/media" },
      { label: "Analytiques", href: "/dashboard/analytics" },
      { label: "Paramètres", href: "/dashboard/settings" },
      { label: "Utilisateurs", href: "/dashboard/users" },
    ],
  },
};
