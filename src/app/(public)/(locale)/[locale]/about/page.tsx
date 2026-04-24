import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { validateLocale } from "@/lib/locale";
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
    title: locale === "fr" ? "À propos" : "About",
    description:
      locale === "fr"
        ? "Mission et approche éditoriale de Le Relief."
        : "Mission and editorial approach of Le Relief.",
    alternates: {
      canonical: `/${locale}/about`,
      languages: { fr: "/fr/about", en: "/en/about" },
    },
  };
}

export default async function LocalizedAboutPage({
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
          id: "mission",
          title: "Notre mission",
          body: (
            <p>
              Le Relief est une publication numérique haïtienne dont
              l&apos;ambition est de couvrir Haïti avec profondeur, contexte et
              responsabilité. Fondée pour offrir une alternative sérieuse aux
              flux d&apos;informations fragmentés, la rédaction s&apos;attache à
              distinguer les faits de l&apos;opinion, à documenter les événements
              avec précision et à s&apos;adresser aussi bien au lectorat local
              qu&apos;à la diaspora haïtienne et au public international
              francophone.
            </p>
          ),
        },
        {
          id: "approche",
          title: "Notre approche",
          body: (
            <>
              <p>
                Le français est notre langue de rédaction principale. Chaque
                article est produit selon des standards journalistiques stricts :
                vérification des sources, attribution claire des informations,
                séparation nette entre faits établis et analyses. Nos formats
                incluent l&apos;actualité courte, l&apos;analyse de fond, le
                reportage, la tribune et le dossier thématique.
              </p>
              <p>
                Certains contenus sont également disponibles en anglais, traduits
                avec l&apos;assistance de l&apos;intelligence artificielle puis
                révisés par notre équipe éditoriale. Tout contenu traduit
                automatiquement est clairement identifié comme tel.
              </p>
            </>
          ),
        },
        {
          id: "independance",
          title: "Indépendance éditoriale",
          body: (
            <p>
              Le Relief n&apos;est affilié à aucun parti politique, aucune
              institution gouvernementale ni aucun groupe d&apos;intérêts privés.
              Nos décisions éditoriales sont guidées exclusivement par
              l&apos;intérêt public et la valeur informative pour nos lecteurs.
              Nous ne publions pas de contenu commandité présenté comme une
              information journalistique.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Pour tout signalement d&apos;erreur, proposition d&apos;article ou
              demande de collaboration, utilisez notre{" "}
              <a href={`/${locale}/contact`}>formulaire de contact</a>.
            </p>
          ),
        },
      ]
    : [
        {
          id: "mission",
          title: "Our mission",
          body: (
            <p>
              Le Relief is a Haitian digital publication dedicated to covering
              Haiti with depth, context and editorial responsibility. Founded to
              provide a serious alternative to fragmented news flows, the
              newsroom is committed to distinguishing fact from opinion,
              documenting events with precision, and speaking to local readers,
              the Haitian diaspora and the broader international francophone
              audience alike.
            </p>
          ),
        },
        {
          id: "approach",
          title: "Our approach",
          body: (
            <>
              <p>
                French is our primary language of publication. Every article is
                produced to strict journalistic standards: source verification,
                clear attribution, and a firm separation between established
                facts and analysis. Our formats include breaking news, in-depth
                analysis, reportage, opinion columns and thematic dossiers.
              </p>
              <p>
                Select content is also available in English, translated with the
                assistance of artificial intelligence and reviewed by our
                editorial team. All automatically translated content is clearly
                labelled as such.
              </p>
            </>
          ),
        },
        {
          id: "independence",
          title: "Editorial independence",
          body: (
            <p>
              Le Relief is not affiliated with any political party, government
              institution or private interest group. Our editorial decisions are
              guided solely by the public interest and the informational value
              for our readers. We do not publish sponsored content presented as
              journalism.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              To report an error, pitch a story or discuss a collaboration,
              please use our <a href={`/${locale}/contact`}>contact form</a>.
            </p>
          ),
        },
      ];

  return (
    <InstitutionalPageShell
      locale={isFr ? "fr" : "en"}
      slug="about"
      kicker={isFr ? "La rédaction" : "Newsroom"}
      title={
        isFr ? `À propos de ${siteConfig.name}` : `About ${siteConfig.name}`
      }
      deck={
        isFr
          ? "Un média numérique haïtien fondé sur la rigueur, l’indépendance et la précision."
          : "A Haitian digital publication built on rigour, independence and precision."
      }
      sections={sections}
    />
  );
}
