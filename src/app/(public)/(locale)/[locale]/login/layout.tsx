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
        ? "Connexion | Le Relief Haïti"
        : "Sign in | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Connectez-vous à votre compte Le Relief."
        : "Sign in to your Le Relief account.",
    alternates: buildCanonicalAlternates(`/${locale}/login`, {
      fr: "/fr/login",
      en: "/en/login",
      "x-default": "/fr/login",
    }),
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}