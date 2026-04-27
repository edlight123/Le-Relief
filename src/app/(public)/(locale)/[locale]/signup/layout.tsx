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
        ? "Inscription | Le Relief Haïti"
        : "Sign up | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Créez votre compte Le Relief en quelques secondes."
        : "Create your Le Relief account in seconds.",
    alternates: buildCanonicalAlternates(`/${locale}/signup`, {
      fr: "/fr/signup",
      en: "/en/signup",
      "x-default": "/fr/signup",
    }),
  };
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}