import type { Metadata } from "next";
import { Libre_Franklin, Newsreader } from "next/font/google";
import { siteConfig } from "@/config/site.config";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  style: ["normal", "italic"],
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
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Le Relief — Média numérique haïtien",
    description:
      "Le Relief est une publication numérique haïtienne, française d'abord, dédiée à l'actualité, l'analyse, l'opinion et aux dossiers d'intérêt public.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Le Relief",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Relief — Média numérique haïtien",
    description:
      "Le Relief est une publication numérique haïtienne, française d'abord, dédiée à l'actualité, l'analyse, l'opinion et aux dossiers d'intérêt public.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
      className={`${libreFranklin.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
      </body>
    </html>
  );
}
