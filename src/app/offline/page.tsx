export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary opacity-70"
        aria-hidden="true"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>

      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Vous êtes hors connexion
        </h1>
        <p className="text-muted max-w-sm text-sm leading-relaxed">
          Vérifiez votre connexion internet et réessayez. Les articles récemment
          consultés restent disponibles hors ligne.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="rounded-sm bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        Réessayer
      </button>
    </main>
  );
}
