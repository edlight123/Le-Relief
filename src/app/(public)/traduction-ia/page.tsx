export const metadata = {
  title: "Traduction assistée par IA | Le Relief Haïti",
  description:
    "La politique de Le Relief pour les traductions anglaises assistées par IA et revues par la rédaction.",
};

export default function AiTranslationPolicyPage() {
  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Bilingue</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          Traduction assistée par IA
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          L&apos;anglais est une couche de diffusion sélective. Il ne remplace pas la
          version française, qui demeure la source éditoriale canonique.
        </p>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <h2>Principe</h2>
        <p>
          Certains articles de portée stratégique peuvent être traduits ou
          adaptés en anglais avec l&apos;assistance d&apos;un modèle de langage. Aucune
          traduction assistée par IA ne doit être publiée sans revue éditoriale.
        </p>

        <h2>Revue humaine</h2>
        <p>
          La rédaction vérifie les noms, dates, chiffres, citations, institutions,
          lieux, nuances politiques et éléments sensibles avant publication d&apos;une
          version anglaise.
        </p>

        <h2>Responsabilité éditoriale</h2>
        <p>
          L&apos;IA peut accélérer la production d&apos;un brouillon anglais, mais Le
          Relief conserve la responsabilité finale du texte publié, de ses
          métadonnées et de sa relation avec l&apos;article source.
        </p>

        <h2>Sélection</h2>
        <p>
          Tous les articles ne sont pas traduits. La priorité va aux analyses,
          dossiers, éditoriaux, sujets économiques ou politiques majeurs et
          contenus d&apos;intérêt international ou diasporique.
        </p>
      </div>
    </div>
  );
}
