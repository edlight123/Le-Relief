import { siteConfig } from "@/config/site.config";

export const metadata = {
  title: "À Propos | Le Relief Haïti",
  description: "Découvrez Le Relief Haïti et notre mission",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
        À Propos de {siteConfig.name}
      </h1>

      <div className="section-divider mt-3 mb-8" />

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>
          Le Relief Haïti est une plateforme de nouvelles numériques premium dédiée
          à offrir un journalisme de haute qualité et digne de confiance à un
          public mondial.
        </p>

        <h2>Notre Mission</h2>
        <p>
          Nous croyons que le journalisme de qualité compte. Notre mission est de fournir
          aux lecteurs des nouvelles bien recherchées, magnifiquement présentées
          et du contenu éditorial qui informe, inspire et responsabilise.
        </p>

        <h2>Principes Éditoriaux</h2>
        <p>
          Chaque article publié sur Le Relief Haïti est vérifié pour son exactitude,
          sa clarté et son intégrité éditoriale. Nous nous engageons pour un
          journalisme juste et indépendant qui sert l&apos;intérêt public.
        </p>

        <h2>Confiance & Crédibilité</h2>
        <p>
          Le Relief Haïti est fondé sur la confiance. Nous maintenons des normes
          éditoriales strictes et sommes transparents sur nos processus,
          sources et décisions éditoriales.
        </p>

        <h2>Notre Plateforme</h2>
        <p>
          Nous combinons l&apos;expérience d&apos;un site d&apos;information public soigné avec la
          puissance interne d&apos;un espace de travail de rédaction professionnelle, garantissant
          aux lecteurs comme aux éditeurs une expérience premium.
        </p>
      </div>
    </div>
  );
}
