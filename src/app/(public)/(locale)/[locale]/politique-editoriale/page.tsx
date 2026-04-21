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
        ? "Politique éditoriale | Le Relief Haïti"
        : "Editorial Policy | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Les principes éditoriaux, standards de publication et distinctions de formats de Le Relief."
        : "The editorial principles, publication standards and format distinctions of Le Relief.",
    alternates: {
      canonical: `/${locale}/politique-editoriale`,
      languages: {
        fr: "/fr/politique-editoriale",
        en: "/en/politique-editoriale",
      },
    },
  };
}

export default async function EditorialPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isFr = locale !== "en";

  if (isFr) {
    return (
      <div className="newspaper-shell py-10 sm:py-14">
        <header className="mb-10 border-t-2 border-border-strong pt-5">
          <p className="page-kicker mb-3">Transparence</p>
          <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
            Politique éditoriale
          </h1>
          <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
            Le français est notre langue source. Chaque publication doit servir
            la compréhension des faits, la précision et la confiance du lecteur.
          </p>
        </header>

        <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
          <h2>Standards rédactionnels</h2>
          <p>
            Les articles publiés par Le Relief doivent être vérifiés, attribués
            et présentés avec une séparation claire entre faits établis,
            contexte, hypothèses et points de vue. Les noms, dates, chiffres,
            institutions et citations font l&apos;objet d&apos;une attention
            particulière avant publication.
          </p>

          <h2>Types de contenu</h2>
          <p>
            Une actualité rapporte un fait public vérifié. Une analyse apporte
            du contexte et une lecture structurée. Une opinion ou une tribune
            engage son auteur. Un éditorial exprime une position assumée de la
            rédaction. Un dossier rassemble plusieurs angles autour d&apos;un
            même sujet.
          </p>

          <h2>Indépendance</h2>
          <p>
            Les décisions éditoriales sont prises selon l&apos;intérêt public,
            la valeur informative et la pertinence pour les lecteurs en Haïti,
            dans la diaspora et à l&apos;international.
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
          Editorial Policy
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          French is our source language. Every publication must serve reader
          comprehension, factual precision and trust.
        </p>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <h2>Editorial standards</h2>
        <p>
          Articles published by Le Relief must be verified, attributed and
          presented with a clear separation between established facts, context,
          hypotheses and points of view. Names, dates, figures, institutions and
          quotations are subject to particular scrutiny before publication.
        </p>

        <h2>Content types</h2>
        <p>
          A news report covers a verified public fact. An analysis provides
          context and a structured reading of events. An opinion piece or
          column reflects its author&apos;s views. An editorial expresses a
          position taken by the newsroom. A dossier gathers multiple
          perspectives on a single subject.
        </p>

        <h2>Independence</h2>
        <p>
          Editorial decisions are made based on public interest, informational
          value and relevance for readers in Haiti, the diaspora and
          internationally.
        </p>
      </div>
    </div>
  );
}
