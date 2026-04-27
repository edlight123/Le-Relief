import type { Metadata } from "next";
import { validateLocale } from "@/lib/locale";
import { buildCanonicalAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!validateLocale(locale)) return {};

  return {
    title:
      locale === "fr"
        ? "Contactez la rédaction | Le Relief Haïti"
        : "Contact the newsroom | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Écrivez à la rédaction du Relief pour tout signalement, question ou collaboration."
        : "Write to the Le Relief newsroom for any tip, question or collaboration.",
    alternates: buildCanonicalAlternates(`/${locale}/contact`, {
      fr: "/fr/contact",
      en: "/en/contact",
      "x-default": "/fr/contact",
    }),
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}