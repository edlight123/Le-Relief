export const metadata = {
  title: "Politique éditoriale | Le Relief Haïti",
  description:
    "Les principes éditoriaux, standards de publication et distinctions de formats de Le Relief.",
};

export default function EditorialPolicyPage() {
  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Transparence</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          Politique éditoriale
        </h1>
        <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
          Le français est notre langue source. Chaque publication doit servir la
          compréhension des faits, la précision et la confiance du lecteur.
        </p>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <h2>Standards rédactionnels</h2>
        <p>
          Les articles publiés par Le Relief doivent être vérifiés, attribués et
          présentés avec une séparation claire entre faits établis, contexte,
          hypothèses et points de vue. Les noms, dates, chiffres, institutions et
          citations font l&apos;objet d&apos;une attention particulière avant publication.
        </p>

        <h2>Types de contenu</h2>
        <p>
          Une actualité rapporte un fait public vérifié. Une analyse apporte du
          contexte et une lecture structurée. Une opinion ou une tribune engage
          son auteur. Un éditorial exprime une position assumée de la rédaction.
          Un dossier rassemble plusieurs angles autour d&apos;un même sujet.
        </p>

        <h2>Indépendance</h2>
        <p>
          Les décisions éditoriales sont prises selon l&apos;intérêt public, la valeur
          informative et la pertinence pour les lecteurs en Haïti, dans la
          diaspora et à l&apos;international.
        </p>
      </div>
    </div>
  );
}
