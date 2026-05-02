import type { Metadata } from "next";
import { Libre_Franklin, Source_Serif_4, Spectral, IBM_Plex_Mono } from "next/font/google";
import { siteConfig } from "@/config/site.config";
import { buildOgImage } from "@/lib/seo";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: false,
});

// NOTE on preload: Next.js auto-emits a <link rel="preload"> for every
// font variant declared. Many internal pages (dashboard, /admin/social…)
// do not use every declared face/weight during initial paint, which spams
// the console with "preloaded but not used" warnings. Disable font preloads
// globally and let the CSS variables hydrate on demand.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Le Relief — Média numérique haïtien",
    template: "%s | Le Relief",
  },
  description:
    "Le Relief est une publication numérique haïtienne, française d'abord, dédiée à l'actualité, l'analyse, l'opinion et aux dossiers d'intérêt public.",
  keywords: [
    "Le Relief",
    "actualité",
    "Haïti",
    "éditorial",
    "journalisme",
    "analyse",
  ],
  alternates: {
    canonical: siteConfig.url,
    languages: {
      "fr": `${siteConfig.url}/fr`,
      "en": `${siteConfig.url}/en`,
      "x-default": siteConfig.url,
    },
    types: {
      "application/rss+xml": `${siteConfig.url}/feed.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Le Relief — Média numérique haïtien",
    description:
      "Le Relief est une publication numérique haïtienne, française d'abord, dédiée à l'actualité, l'analyse, l'opinion et aux dossiers d'intérêt public.",
    images: buildOgImage("/logo.png", "Le Relief"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Relief — Média numérique haïtien",
    description:
      "Le Relief est une publication numérique haïtienne, française d'abord, dédiée à l'actualité, l'analyse, l'opinion et aux dossiers d'intérêt public.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Le Relief",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${libreFranklin.variable} ${sourceSerif.variable} ${spectral.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
      </body>
    </html>
  );
}
