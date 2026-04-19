import { siteConfig } from "@/config/site.config";

export const metadata = {
  title: "À propos | Le Relief Haïti",
  description:
    "Mission, ligne éditoriale, positionnement et approche bilingue de Le Relief Haïti.",
};

export default function AboutPage() {
  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">La rédaction</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          À propos de {siteConfig.name}
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          Une publication numérique haïtienne structurée autour de l&apos;actualité,
          de l&apos;analyse, de l&apos;opinion et des dossiers d&apos;intérêt public.
        </p>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <p>
          Le Relief couvre Haïti avec une priorité donnée au contexte, à la
          hiérarchie de l&apos;information et à la clarté des formats. Le site est
          pensé comme une publication éditoriale, pas comme un simple flux
          d&apos;articles.
        </p>

        <h2>Notre mission</h2>
        <p>
          Donner aux lecteurs francophones en Haïti et dans la diaspora une
          lecture fiable des sujets publics, tout en rendant certains contenus
          accessibles à un lectorat international anglophone.
        </p>

        <h2>Ligne éditoriale</h2>
        <p>
          Les faits, l&apos;analyse et l&apos;opinion doivent être identifiables. Chaque
          article indique sa rubrique, son type de contenu, son auteur, sa date et
          les éléments utiles à la compréhension du lecteur.
        </p>

        <h2>Français d&apos;abord</h2>
        <p>
          Le français demeure la langue source et la référence éditoriale. La
          sélection anglaise sert les articles à forte portée publique,
          internationale ou diasporique.
        </p>

        <h2>Engagement de qualité</h2>
        <p>
          Nous privilégions une autorité calme : titres précis, hiérarchie
          claire, correction des erreurs significatives et transparence sur
          l&apos;usage de l&apos;IA dans les traductions.
        </p>
      </div>
    </div>
  );
}
