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
        ? "Traduction assistée par IA | Le Relief Haïti"
        : "AI-assisted translation | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Comment Le Relief utilise l’intelligence artificielle dans son processus de traduction."
        : "How Le Relief uses artificial intelligence in its translation workflow.",
    alternates: {
      canonical: `/${locale}/traduction-ia`,
      languages: { fr: "/fr/traduction-ia", en: "/en/traduction-ia" },
    },
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

  if (isFr) {
    return (
      <div className="newspaper-shell py-10 sm:py-14">
        <header className="mb-10 border-t-2 border-border-strong pt-5">
          <p className="page-kicker mb-3">Transparence</p>
          <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
            Traduction assist&eacute;e par IA
          </h1>
          <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
            Comment nous utilisons l&apos;intelligence artificielle dans notre processus de
            traduction, et ce que cela signifie pour le lecteur.
          </p>
        </header>

        <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
          <h2>Notre d&eacute;marche</h2>
          <p>
            Le Relief est une publication fran&ccedil;ophone. L&apos;anglais est une langue de
            diffusion secondaire destin&eacute;e &agrave; &eacute;largir notre lectorat au sein de la
            diaspora ha&iuml;tienne anglophone et &agrave; l&apos;international. Pour rendre cette
            extension possible sans compromettre la qualit&eacute; r&eacute;dactionnelle, nous
            utilisons des outils de traduction automatiqu&eacute;e assist&eacute;s par intelligence
            artificielle, suivis d&apos;une r&eacute;vision humaine.
          </p>

          <h2>Processus de traduction</h2>
          <p>
            Chaque article publi&eacute; en anglais sur Le Relief est d&apos;abord r&eacute;dig&eacute;
            en fran&ccedil;ais. Le texte source est ensuite traduit automatiquement par un syst&egrave;me
            d&apos;IA, puis relu et corrig&eacute; par un membre de l&apos;&eacute;quipe
            &eacute;ditoriale. Le titre, le chapeau, les citations directes et les termes
            sp&eacute;cifiques au contexte ha&iuml;tien font l&apos;objet d&apos;une attention
            particuli&egrave;re lors de cette r&eacute;vision.
          </p>

          <h2>Identification des traductions</h2>
          <p>
            Tout article disponible en version anglaise est signal&eacute; comme traduit avec
            l&apos;assistance de l&apos;IA. Cette mention est visible sur la page de
            l&apos;article. Elle garantit la transparence vis-&agrave;-vis du lecteur et
            distingue ce contenu des articles r&eacute;dig&eacute;s originellement en anglais,
            si cette pratique devait &eacute;voluer &agrave; l&apos;avenir.
          </p>

          <h2>Limites et responsabilit&eacute;</h2>
          <p>
            La traduction automatiqu&eacute;e peut g&eacute;n&eacute;rer des approximations,
            notamment sur les registres culturels, les noms propres ha&iuml;tiens ou les
            r&eacute;f&eacute;rences locales. En cas d&apos;erreur de traduction signal&eacute;e,
            nous corrigeons l&apos;article et mettons &agrave; jour la version anglaise dans les
            meilleurs d&eacute;lais. La version fran&ccedil;aise fait toujours foi.
          </p>

          <h2>Signaler une erreur de traduction</h2>
          <p>
            Si vous constatez une erreur dans une version anglaise d&apos;un article, merci de
            nous le faire savoir via notre{" "}
            <a href="/contact">formulaire de contact</a>, en pr&eacute;cisant l&apos;URL
            de l&apos;article et la nature de l&apos;erreur.
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
          AI-assisted translation
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          How we use artificial intelligence in our translation workflow, and what it means for
          our readers.
        </p>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <h2>Our approach</h2>
        <p>
          Le Relief is a French-language publication. English is a secondary distribution language
          intended to reach the anglophone Haitian diaspora and international readers. To make this
          possible without compromising editorial quality, we use AI-assisted automatic translation
          tools, followed by human review.
        </p>

        <h2>Translation process</h2>
        <p>
          Every article published in English on Le Relief is first written in French. The source
          text is then automatically translated by an AI system, then read and corrected by a
          member of the editorial team. The headline, standfirst, direct quotations and terms
          specific to the Haitian context receive particular attention during this review.
        </p>

        <h2>Labelling translated content</h2>
        <p>
          Any article available in an English version is labelled as AI-assisted translation. This
          notice is visible on the article page. It ensures transparency for the reader and
          distinguishes this content from articles originally written in English, should that
          practice evolve in the future.
        </p>

        <h2>Limitations and accountability</h2>
        <p>
          Automated translation can produce approximations, especially around cultural registers,
          Haitian proper nouns or local references. If a translation error is reported, we correct
          the article and update the English version promptly. The French version always takes
          precedence.
        </p>

        <h2>Report a translation error</h2>
        <p>
          If you spot an error in the English version of an article, please let us know via our{" "}
          <a href="/contact">contact form</a>, specifying the article URL and the nature of the
          error.
        </p>
      </div>
    </div>
  );
}
