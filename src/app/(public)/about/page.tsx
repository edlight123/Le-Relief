import { siteConfig } from "@/config/site.config";

export const metadata = {
  title: "À Propos | Le Relief Haïti",
  description: "Découvrez Le Relief Haïti et notre mission",
};

export default function AboutPage() {
  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">La rédaction</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          À propos de {siteConfig.name}
        </h1>
      </header>

      <div className="prose prose-lg max-w-3xl font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
        <p>
          Le Relief Haïti est une plateforme de nouvelles numériques premium dédiée
          à offrir un journalisme de haute qualité et digne de confiance à un
          public mondial.
        </p>

        <h2>Notre mission</h2>
        <p>
          Nous croyons que le journalisme de qualité compte. Notre mission est de fournir
          aux lecteurs des nouvelles bien recherchées, magnifiquement présentées
          et du contenu éditorial qui informe, inspire et responsabilise.
        </p>

        <h2>Principes éditoriaux</h2>
        <p>
          Chaque article publié sur Le Relief Haïti est vérifié pour son exactitude,
          sa clarté et son intégrité éditoriale. Nous nous engageons pour un
          journalisme juste et indépendant qui sert l&apos;intérêt public.
        </p>

        <h2>Confiance & crédibilité</h2>
        <p>
          Le Relief Haïti est fondé sur la confiance. Nous maintenons des normes
          éditoriales strictes et sommes transparents sur nos processus,
          sources et décisions éditoriales.
        </p>

        <h2>Notre plateforme</h2>
        <p>
          Nous combinons l&apos;expérience d&apos;un site d&apos;information public soigné avec la
          puissance interne d&apos;un espace de travail de rédaction professionnelle, garantissant
          aux lecteurs comme aux éditeurs une expérience premium.
        </p>
      </div>
    </div>
  );
}
