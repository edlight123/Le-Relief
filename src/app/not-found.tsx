import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable | Le Relief",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center">
      <div className="newspaper-shell w-full py-16 sm:py-24">
        <div className="border-t-2 border-border-strong pt-6">
          <p className="page-kicker mb-4">Erreur 404</p>
          <h1 className="editorial-title text-6xl text-foreground sm:text-8xl">
            Page introuvable.
          </h1>
          <p className="editorial-deck mt-6 max-w-xl font-body text-xl leading-relaxed text-muted">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
            Revenez à l&apos;accueil ou lancez une recherche.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/"
              className="border border-border-strong bg-foreground px-6 py-3 font-label text-xs font-extrabold uppercase text-background transition-colors hover:bg-primary hover:border-primary"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/search"
              className="border border-border-strong px-6 py-3 font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:bg-surface-elevated"
            >
              Rechercher
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
