import { validateLocale } from "@/lib/locale";

export default async function LocalizedAiTranslationPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!validateLocale(locale)) return null;

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          {locale === "fr" ? "Traduction assistée par IA" : "AI-assisted translation"}
        </h1>
      </header>
    </div>
  );
}
