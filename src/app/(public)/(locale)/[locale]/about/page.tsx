import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { validateLocale } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!validateLocale(locale)) return {};

  return {
    title: locale === "fr" ? "À propos" : "About",
    description:
      locale === "fr"
        ? "Mission et approche éditoriale de Le Relief."
        : "Mission and editorial approach of Le Relief.",
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        fr: "/fr/about",
        en: "/en/about",
      },
    },
  };
}

export default async function LocalizedAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!validateLocale(locale)) return null;

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">{locale === "fr" ? "La rédaction" : "Newsroom"}</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          {locale === "fr" ? "À propos de" : "About"} {siteConfig.name}
        </h1>
      </header>
    </div>
  );
}
