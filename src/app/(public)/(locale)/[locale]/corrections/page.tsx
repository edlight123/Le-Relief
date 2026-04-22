import type { Metadata } from "next";
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
        ? "Politique de correction | Le Relief Haïti"
        : "Corrections policy | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Comment Le Relief corrige ses erreurs factuelle et s’engage envers la précision."
        : "How Le Relief corrects factual errors and upholds accuracy.",
    alternates: {
      canonical: `/${locale}/corrections`,
      languages: { fr: "/fr/corrections", en: "/en/corrections" },
    },
  };
}

export default async function LocalizedCorrectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!validateLocale(locale)) return null;

  const isFr = locale !== "en";

  if (isFr) {
    return (
      <div className="newspaper-shell py-10 sm:py-14">
        <header className="mb-10 border-t-2 border-border-strong pt-5">
          <p className="page-kicker mb-3">Transparence</p>
          <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
            Politique de correction
          </h1>
          <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
            Nous corrigeons nos erreurs rapidement, clairement et sans détour.
          </p>
        </header>

        <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
          <h2>Notre engagement</h2>
          <p>
            Le Relief s&apos;engage à corriger toute erreur factuelle dès qu&apos;elle est
            identifiée. La précision et la confiance de nos lecteurs sont au cœur de notre
            déontologie. Lorsqu&apos;une erreur est avérée, nous la corrigeons dans l&apos;article
            concerné et, selon la nature de l&apos;erreur, nous la signalons explicitement en fin
            de texte.
          </p>

          <h2>Qu&apos;est-ce qu&apos;une correction&nbsp;?</h2>
          <p>
            Une correction s&apos;applique lorsqu&apos;un fait, un chiffre, un nom, une date ou
            une citation a été publié de manière inexacte. Elle se distingue d&apos;une mise à
            jour (ajout d&apos;un développement ultérieur) et d&apos;une clarification
            (reformulation sans changement de sens).
          </p>

          <h2>Comment signaler une erreur&nbsp;?</h2>
          <p>
            Tout lecteur peut signaler une inexactitude via notre{" "}
            <a href="/contact">formulaire de contact</a>. Merci d&apos;indiquer
            l&apos;URL de l&apos;article, la nature de l&apos;erreur et, si possible, la source
            permettant de l&apos;établir. Notre équipe examine chaque signalement et répond dans
            les meilleurs délais.
          </p>

          <h2>Historique des corrections</h2>
          <p>
            Les corrections significatives sont indiquées directement dans l&apos;article, avec
            la mention <em>Correction</em> et la date de modification, en bas du texte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Transparency</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          Corrections policy
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          We correct our mistakes promptly, clearly and without equivocation.
        </p>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <h2>Our commitment</h2>
        <p>
          Le Relief is committed to correcting any factual error as soon as it is identified.
          Accuracy and reader trust are central to our editorial ethics. When an error is confirmed,
          we correct it in the relevant article and, depending on the nature of the error, note it
          explicitly at the end of the piece.
        </p>

        <h2>What counts as a correction?</h2>
        <p>
          A correction applies when a fact, figure, name, date or quotation was published
          inaccurately. It is distinct from an update (adding a later development) and a
          clarification (rewording without changing the meaning).
        </p>

        <h2>How to report an error</h2>
        <p>
          Any reader can flag an inaccuracy via our{" "}
          <a href="/contact">contact form</a>. Please include the article URL, the nature of
          the error and, where possible, the source that establishes it. Our team reviews each
          report and responds promptly.
        </p>

        <h2>Corrections log</h2>
        <p>
          Significant corrections are noted directly in the article, with the label{" "}
          <em>Correction</em> and the date of the change, at the bottom of the text.
        </p>
      </div>
    </div>
  );
}
