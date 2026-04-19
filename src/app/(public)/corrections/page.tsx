export const metadata = {
  title: "Politique de correction | Le Relief Haïti",
  description:
    "Comment Le Relief corrige, met à jour et signale les modifications importantes.",
};

export default function CorrectionsPage() {
  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Rigueur</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          Politique de correction
        </h1>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <p>
          Lorsqu&apos;une erreur factuelle est identifiée, Le Relief la corrige dans
          les meilleurs délais. Les corrections importantes doivent être
          signalées de manière visible dans l&apos;article concerné.
        </p>

        <h2>Ce qui doit être corrigé</h2>
        <p>
          Les noms propres, dates, chiffres, fonctions officielles, citations,
          lieux, attributions et formulations pouvant modifier le sens d&apos;un fait
          relèvent d&apos;une correction éditoriale.
        </p>

        <h2>Versions traduites</h2>
        <p>
          Lorsqu&apos;un article français possède une version anglaise, une correction
          significative doit être répercutée ou vérifiée dans les deux versions.
        </p>

        <h2>Nous signaler une erreur</h2>
        <p>
          Les lecteurs peuvent signaler une erreur via la page contact en
          indiquant le titre de l&apos;article, le passage concerné et les éléments
          permettant de vérifier la demande.
        </p>
      </div>
    </div>
  );
}
