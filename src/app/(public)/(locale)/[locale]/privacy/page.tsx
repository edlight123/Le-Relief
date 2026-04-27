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
        ? "Politique de confidentialité | Le Relief Haïti"
        : "Privacy policy | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Ce que Le Relief collecte, pourquoi et comment vos données sont protégées."
        : "What Le Relief collects, why, and how your data is protected.",
    alternates: buildCanonicalAlternates(`/${locale}/privacy`, {
      fr: "/fr/privacy",
      en: "/en/privacy",
      "x-default": "/fr/privacy",
    }),
  };
}

export default async function LocalizedPrivacyPage({
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
          id: "donnees",
          title: "Données collectées",
          body: (
            <>
              <p>
                Le Relief collecte uniquement les données nécessaires au
                fonctionnement du service. Lors de votre navigation, nous
                recueillons des informations d&apos;utilisation anonymisées
                (pages visitées, durée de lecture, langue sélectionnée) à des
                fins d&apos;analyse éditoriale interne. Ces données ne sont
                jamais revendues ni transmises à des tiers à des fins
                commerciales.
              </p>
              <p>
                Si vous vous abonnez à notre lettre d&apos;information, votre
                adresse e-mail est enregistrée dans notre système d&apos;envoi.
                Vous pouvez vous désabonner à tout moment en cliquant sur le
                lien présent dans chaque édition.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <p>
              Nous utilisons des cookies techniques indispensables au bon
              fonctionnement du site (préférence de langue, thème
              d&apos;affichage, session utilisateur). Nous n&apos;utilisons{" "}
              <strong>pas</strong> de cookies publicitaires ni de traceurs
              commerciaux tiers.
            </p>
          ),
        },
        {
          id: "hebergement",
          title: "Hébergement et traitement",
          body: (
            <p>
              Le Relief est hébergé sur les infrastructures de Vercel et
              Firebase. Les données sont stockées dans des centres de données
              situés aux États-Unis et en Europe. Ces prestataires respectent
              les standards de sécurité reconnus dans le secteur.
            </p>
          ),
        },
        {
          id: "droits",
          title: "Vos droits",
          body: (
            <p>
              Vous disposez d&apos;un droit d&apos;accès, de rectification et de
              suppression de vos données. Pour exercer ce droit ou pour toute
              question relative à la vie privée, contactez-nous via notre{" "}
              <a href={`/${locale}/contact`}>formulaire de contact</a>.
            </p>
          ),
        },
        {
          id: "modifications",
          title: "Modifications",
          body: (
            <p>
              Cette politique peut être mise à jour. En cas de changement
              significatif, nous le signalerons sur le site. La date de dernière
              révision est indiquée en bas de cette page.
            </p>
          ),
        },
      ]
    : [
        {
          id: "data",
          title: "Data collected",
          body: (
            <>
              <p>
                Le Relief only collects data necessary to run the service. While
                you browse, we gather anonymised usage information (pages
                visited, reading duration, selected language) for internal
                editorial analysis. This data is never sold or shared with third
                parties for commercial purposes.
              </p>
              <p>
                If you subscribe to our newsletter, your email address is stored
                in our mailing system. You can unsubscribe at any time by
                clicking the link in any edition.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <p>
              We use technical cookies essential to the proper functioning of
              the site (language preference, display theme, user session). We do{" "}
              <strong>not</strong> use advertising cookies or third-party
              commercial trackers.
            </p>
          ),
        },
        {
          id: "hosting",
          title: "Hosting and processing",
          body: (
            <p>
              Le Relief is hosted on Vercel and Firebase infrastructure. Data is
              stored in data centres located in the United States and Europe.
              These providers comply with recognised industry security
              standards.
            </p>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <p>
              You have the right to access, correct and delete your data. To
              exercise this right or for any privacy-related question, contact
              us via our <a href={`/${locale}/contact`}>contact form</a>.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes",
          body: (
            <p>
              This policy may be updated. In the event of a significant change,
              we will notify readers on the site. The last revision date is
              shown at the bottom of this page.
            </p>
          ),
        },
      ];

  return (
    <InstitutionalPageShell
      locale={isFr ? "fr" : "en"}
      slug="privacy"
      kicker={isFr ? "Lecteurs" : "Readers"}
      title={isFr ? "Politique de confidentialité" : "Privacy policy"}
      deck={
        isFr
          ? "Ce que nous collectons, pourquoi nous le faisons et comment nous protégeons vos données."
          : "What we collect, why we do it and how we protect your data."
      }
      sections={sections}
      updatedAt={isFr ? "avril 2026" : "April 2026"}
    />
  );
}
