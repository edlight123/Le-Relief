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
  description: "Plateforme de Nouvelles et d'Éditoriaux Premium",
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
      { label: "À Propos", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    dashboard: [
      { label: "Tableau de Bord", href: "/dashboard" },
      { label: "Articles", href: "/dashboard/articles" },
      { label: "Nouvel Article", href: "/dashboard/articles/new" },
      { label: "Médias", href: "/dashboard/media" },
      { label: "Analytiques", href: "/dashboard/analytics" },
      { label: "Paramètres", href: "/dashboard/settings" },
      { label: "Utilisateurs", href: "/dashboard/users" },
    ],
  },
};
