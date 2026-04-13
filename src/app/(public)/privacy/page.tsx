export const metadata = {
  title: "Politique de Confidentialité | Le Relief Haïti",
  description: "Politique de confidentialité et pratiques de gestion des données",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
        Politique de Confidentialité
      </h1>

      <div className="section-divider mt-3 mb-8" />

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>
          Le Relief Haïti s&apos;engage à protéger votre vie privée. Cette politique
          explique quelles données nous collectons, comment nous les utilisons et
          quels sont vos droits.
        </p>

        <h2>Données Collectées</h2>
        <p>
          Lorsque vous créez un compte, nous collectons votre nom, adresse
          courriel et image de profil. Si vous vous connectez via un fournisseur
          tiers tel que Google, nous recevons les informations de profil de base
          de ce service.
        </p>

        <h2>Authentification & Sessions</h2>
        <p>
          Nous utilisons une authentification sécurisée par sessions. Les mots de
          passe sont hachés à l&apos;aide d&apos;algorithmes standards de l&apos;industrie et ne
          sont jamais stockés en texte clair.
        </p>

        <h2>Cookies</h2>
        <p>
          Nous utilisons des cookies essentiels pour maintenir votre session et
          stocker votre préférence de thème (mode clair ou sombre). Nous
          n&apos;utilisons pas de cookies publicitaires ou de suivi.
        </p>

        <h2>Services Tiers</h2>
        <p>
          Le Relief Haïti s&apos;intègre avec des fournisseurs d&apos;authentification
          tiers (Google) pour faciliter la connexion. Nous ne vendons ni ne
          partageons vos données personnelles avec des tiers.
        </p>

        <h2>Stockage des Données</h2>
        <p>
          Vos données sont stockées de manière sécurisée et accessibles
          uniquement par les opérations autorisées de la plateforme. Nous
          conservons vos données tant que votre compte est actif.
        </p>

        <h2>Vos Droits</h2>
        <p>
          Vous pouvez demander l&apos;accès, la correction ou la suppression de vos
          données personnelles à tout moment en nous contactant via notre page
          de contact.
        </p>
      </div>
    </div>
  );
}
