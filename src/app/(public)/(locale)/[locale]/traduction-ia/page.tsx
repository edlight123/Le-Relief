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
        ? "Traduction assistée par IA | Le Relief Haïti"
        : "AI-assisted translation | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Comment Le Relief utilise l'intelligence artificielle dans son processus de traduction."
        : "How Le Relief uses artificial intelligence in its translation workflow.",
    alternates: buildCanonicalAlternates(`/${locale}/traduction-ia`, {
      fr: "/fr/traduction-ia",
      en: "/en/traduction-ia",
      "x-default": "/fr/traduction-ia",
    }),
  };
}

export default async function LocalizedAiTranslationPolicyPage({
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
          id: "demarche",
          title: "Notre démarche",
          body: (
            <p>
              Le Relief est une publication francophone. L&apos;anglais est une
              langue de diffusion secondaire destinée à élargir notre lectorat
              au sein de la diaspora haïtienne anglophone et à
              l&apos;international. Pour rendre cette extension possible sans
              compromettre la qualité rédactionnelle, nous utilisons des outils
              de traduction automatisée assistés par intelligence artificielle,
              suivis d&apos;une révision humaine.
            </p>
          ),
        },
        {
          id: "processus",
          title: "Processus de traduction",
          body: (
            <p>
              Chaque article publié en anglais sur Le Relief est d&apos;abord
              rédigé en français. Le texte source est ensuite traduit
              automatiquement par un système d&apos;IA, puis relu et corrigé par
              un membre de l&apos;équipe éditoriale. Le titre, le chapeau, les
              citations directes et les termes spécifiques au contexte haïtien
              font l&apos;objet d&apos;une attention particulière lors de cette
              révision.
            </p>
          ),
        },
        {
          id: "identification",
          title: "Identification des traductions",
          body: (
            <p>
              Tout article disponible en version anglaise est signalé comme
              traduit avec l&apos;assistance de l&apos;IA. Cette mention est
              visible sur la page de l&apos;article. Elle garantit la
              transparence vis-à-vis du lecteur et distingue ce contenu des
              articles rédigés originellement en anglais, si cette pratique
              devait évoluer à l&apos;avenir.
            </p>
          ),
        },
        {
          id: "limites",
          title: "Limites et responsabilité",
          body: (
            <p>
              La traduction automatisée peut générer des approximations,
              notamment sur les registres culturels, les noms propres haïtiens
              ou les références locales. En cas d&apos;erreur de traduction
              signalée, nous corrigeons l&apos;article et mettons à jour la
              version anglaise dans les meilleurs délais.{" "}
              <strong>La version française fait toujours foi.</strong>
            </p>
          ),
        },
        {
          id: "signaler",
          title: "Signaler une erreur de traduction",
          body: (
            <p>
              Si vous constatez une erreur dans une version anglaise d&apos;un
              article, merci de nous le faire savoir via notre{" "}
              <a href={`/${locale}/contact`}>formulaire de contact</a>, en
              précisant l&apos;URL de l&apos;article et la nature de
              l&apos;erreur.
            </p>
          ),
        },
      ]
    : [
        {
          id: "approach",
          title: "Our approach",
          body: (
            <p>
              Le Relief is a French-language publication. English is a secondary
              distribution language intended to reach the anglophone Haitian
              diaspora and international readers. To make this possible without
              compromising editorial quality, we use AI-assisted automatic
              translation tools, followed by human review.
            </p>
          ),
        },
        {
          id: "process",
          title: "Translation process",
          body: (
            <p>
              Every article published in English on Le Relief is first written
              in French. The source text is then automatically translated by an
              AI system, then read and corrected by a member of the editorial
              team. The headline, standfirst, direct quotations and terms
              specific to the Haitian context receive particular attention
              during this review.
            </p>
          ),
        },
        {
          id: "labelling",
          title: "Labelling translated content",
          body: (
            <p>
              Any article available in an English version is labelled as
              AI-assisted translation. This notice is visible on the article
              page. It ensures transparency for the reader and distinguishes
              this content from articles originally written in English, should
              that practice evolve in the future.
            </p>
          ),
        },
        {
          id: "limits",
          title: "Limitations and accountability",
          body: (
            <p>
              Automated translation can produce approximations, especially
              around cultural registers, Haitian proper nouns or local
              references. If a translation error is reported, we correct the
              article and update the English version promptly.{" "}
              <strong>The French version always takes precedence.</strong>
            </p>
          ),
        },
        {
          id: "report",
          title: "Report a translation error",
          body: (
            <p>
              If you spot an error in the English version of an article, please
              let us know via our{" "}
              <a href={`/${locale}/contact`}>contact form</a>, specifying the
              article URL and the nature of the error.
            </p>
          ),
        },
      ];

  return (
    <InstitutionalPageShell
      locale={isFr ? "fr" : "en"}
      slug="traduction-ia"
      kicker={isFr ? "Transparence" : "Transparency"}
      title={isFr ? "Traduction assistée par IA" : "AI-assisted translation"}
      deck={
        isFr
          ? "Comment nous utilisons l’intelligence artificielle dans notre processus de traduction, et ce que cela signifie pour le lecteur."
          : "How we use artificial intelligence in our translation workflow, and what it means for our readers."
      }
      sections={sections}
    />
  );
}
