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
      { label: "Politique", href: "/categories/politique" },
      { label: "Économie", href: "/categories/economie" },
      { label: "International", href: "/categories/international" },
      { label: "Opinion", href: "/categories/opinion" },
      { label: "Culture", href: "/categories/culture" },
      { label: "Recherche", href: "/search" },
    ],
    publicEn: [
      { label: "Home", href: "/" },
      { label: "Politics", href: "/categories/politique" },
      { label: "Economy", href: "/categories/economie" },
      { label: "International", href: "/categories/international" },
      { label: "Opinion", href: "/categories/opinion" },
      { label: "Culture", href: "/categories/culture" },
      { label: "Search", href: "/search" },
    ],
    dashboard: [
      { label: "Tableau de Bord", href: "/dashboard" },
      { label: "Une", href: "/dashboard/homepage" },
      { label: "Articles", href: "/dashboard/articles" },
      { label: "Rubriques", href: "/dashboard/categories" },
      { label: "Auteurs", href: "/dashboard/authors" },
      { label: "Nouvel Article", href: "/dashboard/articles/new" },
      { label: "Médias", href: "/dashboard/media" },
      { label: "Analytiques", href: "/dashboard/analytics" },
      { label: "Paramètres", href: "/dashboard/settings" },
      { label: "Utilisateurs", href: "/dashboard/users" },
    ],
  },
};
