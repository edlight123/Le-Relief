const DEFAULT_APP_URL = "http://localhost:3000";

function getNormalizedAppUrl() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const firstToken = envUrl?.split(/\s+/)[0]?.replaceAll('"', "").trim();
  const candidate = firstToken || DEFAULT_APP_URL;

  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_APP_URL;
  }
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
