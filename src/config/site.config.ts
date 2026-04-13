export const siteConfig = {
  name: "Le Relief Haïti",
  description: "Plateforme de Nouvelles et d'Éditoriaux Premium",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
