import type { Metadata } from "next";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import { validateLocale } from "@/lib/locale";

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
        ? "Lettre d'information — Le Relief"
        : "Newsletter — Le Relief",
    description:
      locale === "fr"
        ? "Recevez une sélection claire des nouvelles, analyses et dossiers à lire."
        : "Receive a clear selection of news, analysis and must-read files.",
  };
}

export default async function LocalizedNewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = validateLocale(rawLocale) ? rawLocale : "fr";

  return (
    <main className="newspaper-shell flex min-h-[80vh] flex-col items-center justify-center py-16 text-center">
      <p className="page-kicker mb-3">
        {locale === "fr" ? "Lettre d'information" : "Newsletter"}
      </p>
      <h1 className="font-headline text-4xl font-extrabold leading-tight text-foreground">
        {locale === "fr"
          ? "Recevez les sujets qui comptent."
          : "Get the stories that matter."}
      </h1>
      <p className="mt-4 max-w-md font-body text-base leading-relaxed text-muted">
        {locale === "fr"
          ? "Une sélection claire des nouvelles, analyses et dossiers à lire. Directement dans votre boîte mail."
          : "A clear editorial selection of news, analysis and essential reads — straight to your inbox."}
      </p>
      <div className="mt-8 w-full max-w-sm">
        <NewsletterSignup
          context="newsletter-page"
          locale={locale === "en" ? "en" : "fr"}
        />
      </div>
    </main>
  );
}
