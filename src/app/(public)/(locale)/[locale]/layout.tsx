import { notFound } from "next/navigation";
import { LocaleProvider } from "@/hooks/useLocaleContext";
import { SUPPORTED_LOCALES, validateLocale } from "@/lib/locale";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!validateLocale(locale)) {
    notFound();
  }

  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}
