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
        ? "Politique éditoriale | Le Relief Haïti"
        : "Editorial Policy | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Les principes éditoriaux, standards de publication et distinctions de formats de Le Relief."
        : "The editorial principles, publication standards and format distinctions of Le Relief.",
    alternates: buildCanonicalAlternates(`/${locale}/politique-editoriale`, {
      fr: "/fr/politique-editoriale",
      en: "/en/politique-editoriale",
      "x-default": "/fr/politique-editoriale",
    }),
  };
}

export default async function EditorialPolicyPage({
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
          id: "standards",
          title: "Standards rédactionnels",
          body: (
            <p>
              Les articles publiés par Le Relief doivent être vérifiés, attribués
              et présentés avec une séparation claire entre faits établis,
              contexte, hypothèses et points de vue. Les noms, dates, chiffres,
              institutions et citations font l&apos;objet d&apos;une attention
              particulière avant publication.
            </p>
          ),
        },
        {
          id: "formats",
          title: "Types de contenu",
          body: (
            <p>
              Une <strong>actualité</strong> rapporte un fait public vérifié. Une{" "}
              <strong>analyse</strong> apporte du contexte et une lecture
              structurée. Une <strong>opinion</strong> ou une{" "}
              <strong>tribune</strong> engage son auteur. Un{" "}
              <strong>éditorial</strong> exprime une position assumée de la
              rédaction. Un <strong>dossier</strong> rassemble plusieurs angles
              autour d&apos;un même sujet.
            </p>
          ),
        },
        {
          id: "independance",
          title: "Indépendance",
          body: (
            <p>
              Les décisions éditoriales sont prises selon l&apos;intérêt public,
              la valeur informative et la pertinence pour les lecteurs en Haïti,
              dans la diaspora et à l&apos;international.
            </p>
          ),
        },
      ]
    : [
        {
          id: "standards",
          title: "Editorial standards",
          body: (
            <p>
              Articles published by Le Relief must be verified, attributed and
              presented with a clear separation between established facts,
              context, hypotheses and points of view. Names, dates, figures,
              institutions and quotations are subject to particular scrutiny
              before publication.
            </p>
          ),
        },
        {
          id: "formats",
          title: "Content types",
          body: (
            <p>
              A <strong>news report</strong> covers a verified public fact. An{" "}
              <strong>analysis</strong> provides context and a structured reading
              of events. An <strong>opinion</strong> piece or{" "}
              <strong>column</strong> reflects its author&apos;s views. An{" "}
              <strong>editorial</strong> expresses a position taken by the
              newsroom. A <strong>dossier</strong> gathers multiple perspectives
              on a single subject.
            </p>
          ),
        },
        {
          id: "independence",
          title: "Independence",
          body: (
            <p>
              Editorial decisions are made based on public interest,
              informational value and relevance for readers in Haiti, the
              diaspora and internationally.
            </p>
          ),
        },
      ];

  return (
    <InstitutionalPageShell
      locale={isFr ? "fr" : "en"}
      slug="politique-editoriale"
      kicker={isFr ? "Transparence" : "Transparency"}
      title={isFr ? "Politique éditoriale" : "Editorial Policy"}
      deck={
        isFr
          ? "Le français est notre langue source. Chaque publication doit servir la compréhension des faits, la précision et la confiance du lecteur."
          : "French is our source language. Every publication must serve reader comprehension, factual precision and trust."
      }
      sections={sections}
    />
  );
}
