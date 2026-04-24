import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable · 404 | Le Relief",
};

export default function NotFound() {
  return (
    <main className="newspaper-shell py-10 sm:py-16">
      <div className="border-y-2 border-border-strong py-10 text-center sm:py-16">
        <p className="page-kicker mb-3" style={{ letterSpacing: "1.4px" }}>
          Erreur 404 · Error 404
        </p>
        <h1 className="editorial-title mx-auto max-w-3xl text-5xl text-foreground sm:text-7xl">
          Page introuvable.
        </h1>
        <p className="editorial-deck mx-auto mt-4 max-w-xl font-body text-lg sm:text-xl">
          La page demandée n&apos;existe pas, a été déplacée ou retirée des archives.
          <br className="hidden sm:block" />
          <span className="text-muted">
            The page you requested doesn&apos;t exist, has moved, or has been
            removed from the archive.
          </span>
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="border border-border-strong bg-foreground px-5 py-2.5 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-background transition-colors hover:bg-primary hover:border-primary"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/en"
            className="border border-border-strong px-5 py-2.5 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-foreground transition-colors hover:bg-surface-elevated"
          >
            Back to home
          </Link>
          <Link
            href="/search"
            className="border border-border-subtle px-5 py-2.5 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Rechercher · Search
          </Link>
        </div>
      </div>
    </main>
  );
}

