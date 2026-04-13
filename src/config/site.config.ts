export const siteConfig = {
  name: "Le Relief",
  description: "Premium Digital News and Editorial Platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  locale: "en-US",
  socials: {
    instagram: "",
    facebook: "",
    x: "",
  },
  nav: {
    public: [
      { label: "Home", href: "/" },
      { label: "Categories", href: "/categories" },
      { label: "Search", href: "/search" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    dashboard: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Articles", href: "/dashboard/articles" },
      { label: "New Article", href: "/dashboard/articles/new" },
      { label: "Media", href: "/dashboard/media" },
      { label: "Analytics", href: "/dashboard/analytics" },
      { label: "Settings", href: "/dashboard/settings" },
      { label: "Users", href: "/dashboard/users" },
    ],
  },
};
