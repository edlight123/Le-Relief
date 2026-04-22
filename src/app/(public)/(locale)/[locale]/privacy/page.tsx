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
        ? "Politique de confidentialité | Le Relief Haïti"
        : "Privacy policy | Le Relief Haïti",
    description:
      locale === "fr"
        ? "Ce que Le Relief collecte, pourquoi et comment vos données sont protégées."
        : "What Le Relief collects, why, and how your data is protected.",
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { fr: "/fr/privacy", en: "/en/privacy" },
    },
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

  if (isFr) {
    return (
      <div className="newspaper-shell py-10 sm:py-14">
        <header className="mb-10 border-t-2 border-border-strong pt-5">
          <p className="page-kicker mb-3">Lecteurs</p>
          <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
            Politique de confidentialit&eacute;
          </h1>
          <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
            Ce que nous collectons, pourquoi nous le faisons et comment nous prot&eacute;geons vos
            donn&eacute;es.
          </p>
        </header>

        <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
          <h2>Donn&eacute;es collect&eacute;es</h2>
          <p>
            Le Relief collecte uniquement les donn&eacute;es n&eacute;cessaires au fonctionnement
            du service. Lors de votre navigation, nous recueillons des informations
            d&apos;utilisation anonymis&eacute;es (pages visit&eacute;es, dur&eacute;e de lecture,
            langue s&eacute;lectionn&eacute;e) &agrave; des fins d&apos;analyse &eacute;ditoriale
            interne. Ces donn&eacute;es ne sont jamais revendu&eacute;es ni transmises &agrave; des
            tiers &agrave; des fins commerciales.
          </p>
          <p>
            Si vous vous abonnez &agrave; notre lettre d&apos;information, votre adresse e-mail
            est enregistr&eacute;e dans notre syst&egrave;me d&apos;envoi. Vous pouvez vous
            d&eacute;sabonner &agrave; tout moment en cliquant sur le lien pr&eacute;sent dans
            chaque &eacute;dition.
          </p>

          <h2>Cookies</h2>
          <p>
            Nous utilisons des cookies techniques indispensables au bon fonctionnement du site
            (pr&eacute;f&eacute;rence de langue, th&egrave;me d&apos;affichage, session
            utilisateur). Nous n&apos;utilisons pas de cookies publicitaires ni de traceurs
            commerciaux tiers.
          </p>

          <h2>H&eacute;bergement et traitement</h2>
          <p>
            Le Relief est h&eacute;berg&eacute; sur les infrastructures de Vercel et Firebase.
            Les donn&eacute;es sont stock&eacute;es dans des centres de donn&eacute;es situ&eacute;s
            aux &Eacute;tats-Unis et en Europe. Ces prestataires respectent les standards de
            s&eacute;curit&eacute; reconnus dans le secteur.
          </p>

          <h2>Vos droits</h2>
          <p>
            Vous disposez d&apos;un droit d&apos;acc&egrave;s, de rectification et de suppression
            de vos donn&eacute;es. Pour exercer ce droit ou pour toute question relative &agrave;
            la vie priv&eacute;e, contactez-nous via notre{" "}
            <a href="/contact">formulaire de contact</a>.
          </p>

          <h2>Modifications</h2>
          <p>
            Cette politique peut &ecirc;tre mise &agrave; jour. En cas de changement significatif,
            nous le signalerons sur le site. La date de derni&egrave;re r&eacute;vision est
            indiqu&eacute;e en bas de cette page.
          </p>

          <p className="text-sm text-muted">
            Derni&egrave;re mise &agrave; jour&nbsp;: avril 2026
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Readers</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          Privacy policy
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          What we collect, why we do it and how we protect your data.
        </p>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <h2>Data collected</h2>
        <p>
          Le Relief only collects data necessary to run the service. While you browse, we gather
          anonymised usage information (pages visited, reading duration, selected language) for
          internal editorial analysis. This data is never sold or shared with third parties for
          commercial purposes.
        </p>
        <p>
          If you subscribe to our newsletter, your email address is stored in our mailing system.
          You can unsubscribe at any time by clicking the link in any edition.
        </p>

        <h2>Cookies</h2>
        <p>
          We use technical cookies essential to the proper functioning of the site (language
          preference, display theme, user session). We do not use advertising cookies or
          third-party commercial trackers.
        </p>

        <h2>Hosting and processing</h2>
        <p>
          Le Relief is hosted on Vercel and Firebase infrastructure. Data is stored in data
          centres located in the United States and Europe. These providers comply with
          recognised industry security standards.
        </p>

        <h2>Your rights</h2>
        <p>
          You have the right to access, correct and delete your data. To exercise this right or
          for any privacy-related question, contact us via our{" "}
          <a href="/contact">contact form</a>.
        </p>

        <h2>Changes</h2>
        <p>
          This policy may be updated. In the event of a significant change, we will notify readers
          on the site. The last revision date is shown at the bottom of this page.
        </p>

        <p className="text-sm text-muted">Last updated: April 2026</p>
      </div>
    </div>
  );
}
