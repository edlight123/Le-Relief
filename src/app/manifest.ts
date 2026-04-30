import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Le Relief — Média numérique haïtien",
    short_name: "Le Relief",
    description:
      "Publication numérique haïtienne, française d'abord et ouverte au lectorat international",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F5EF",
    theme_color: "#8E1E2C",
    orientation: "portrait",
    lang: "fr",
    categories: ["news"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
