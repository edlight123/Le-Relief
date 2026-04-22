import Link from "next/link";

export default function AdminAccessDeniedPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-16">
      <p className="page-kicker">Accès</p>
      <h1 className="font-headline text-4xl font-extrabold text-foreground">Accès refusé</h1>
      <p className="font-body text-muted">
        Votre rôle ne permet pas d&apos;accéder à cette section de l&apos;espace éditorial.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark"
        >
          Retour à l&apos;espace admin
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-sm border border-border-subtle px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-foreground transition-colors hover:bg-surface-elevated"
        >
          Retour au site
        </Link>
      </div>
    </div>
  );
}
