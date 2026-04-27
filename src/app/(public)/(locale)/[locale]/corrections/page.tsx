import type { Metadata } from "next";
import { validateLocale } from "@/lib/locale";
import { buildCanonicalAlternates } from "@/lib/seo";
import InstitutionalPageShell, {
  type InstitutionalSection,
} from "@/components/public/InstitutionalPageShell";

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
        ? "Comment Le Relief corrige ses erreurs factuelles et s'engage envers la précision."
        : "How Le Relief corrects factual errors and upholds accuracy.",
    alternates: buildCanonicalAlternates(`/${locale}/corrections`, {
      fr: "/fr/corrections",
      en: "/en/corrections",
      "x-default": "/fr/corrections",
    }),
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

  const sections: InstitutionalSection[] = isFr
    ? [
        {
          id: "engagement",
          title: "Notre engagement",
          body: (
            <p>
              Le Relief s&apos;engage à corriger toute erreur factuelle dès
              qu&apos;elle est identifiée. La précision et la confiance de nos
              lecteurs sont au cœur de notre déontologie. Lorsqu&apos;une erreur
              est avérée, nous la corrigeons dans l&apos;article concerné et,
              selon la nature de l&apos;erreur, nous la signalons explicitement
              en fin de texte.
            </p>
          ),
        },
        {
          id: "definition",
          title: "Qu’est-ce qu’une correction ?",
          body: (
            <p>
              Une <strong>correction</strong> s&apos;applique lorsqu&apos;un
              fait, un chiffre, un nom, une date ou une citation a été publié de
              manière inexacte. Elle se distingue d&apos;une{" "}
              <strong>mise à jour</strong> (ajout d&apos;un développement
              ultérieur) et d&apos;une <strong>clarification</strong>{" "}
              (reformulation sans changement de sens).
            </p>
          ),
        },
        {
          id: "signaler",
          title: "Comment signaler une erreur ?",
          body: (
            <p>
              Tout lecteur peut signaler une inexactitude via notre{" "}
              <a href={`/${locale}/contact`}>formulaire de contact</a>. Merci
              d&apos;indiquer l&apos;URL de l&apos;article, la nature de
              l&apos;erreur et, si possible, la source permettant de
              l&apos;établir. Notre équipe examine chaque signalement et répond
              dans les meilleurs délais.
            </p>
          ),
        },
        {
          id: "historique",
          title: "Historique des corrections",
          body: (
            <p>
              Les corrections significatives sont indiquées directement dans
              l&apos;article, avec la mention <em>Correction</em> et la date de
              modification, en bas du texte.
            </p>
          ),
        },
      ]
    : [
        {
          id: "commitment",
          title: "Our commitment",
          body: (
            <p>
              Le Relief is committed to correcting any factual error as soon as
              it is identified. Accuracy and reader trust are central to our
              editorial ethics. When an error is confirmed, we correct it in the
              relevant article and, depending on the nature of the error, note
              it explicitly at the end of the piece.
            </p>
          ),
        },
        {
          id: "definition",
          title: "What counts as a correction?",
          body: (
            <p>
              A <strong>correction</strong> applies when a fact, figure, name,
              date or quotation was published inaccurately. It is distinct from
              an <strong>update</strong> (adding a later development) and a{" "}
              <strong>clarification</strong> (rewording without changing the
              meaning).
            </p>
          ),
        },
        {
          id: "report",
          title: "How to report an error",
          body: (
            <p>
              Any reader can flag an inaccuracy via our{" "}
              <a href={`/${locale}/contact`}>contact form</a>. Please include
              the article URL, the nature of the error and, where possible, the
              source that establishes it. Our team reviews each report and
              responds promptly.
            </p>
          ),
        },
        {
          id: "log",
          title: "Corrections log",
          body: (
            <p>
              Significant corrections are noted directly in the article, with
              the label <em>Correction</em> and the date of the change, at the
              bottom of the text.
            </p>
          ),
        },
      ];

  return (
    <InstitutionalPageShell
      locale={isFr ? "fr" : "en"}
      slug="corrections"
      kicker={isFr ? "Transparence" : "Transparency"}
      title={isFr ? "Politique de correction" : "Corrections policy"}
      deck={
        isFr
          ? "Nous corrigeons nos erreurs rapidement, clairement et sans détour."
          : "We correct our mistakes promptly, clearly and without equivocation."
      }
      sections={sections}
    />
  );
}
