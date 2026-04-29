/**
 * Article-specific loading skeleton.
 * Shows instantly on navigation before the async article page resolves.
 */
export default function ArticleLoading() {
  return (
    <div className="newspaper-shell animate-pulse py-6 sm:py-10" aria-hidden="true">
      {/* Breadcrumb */}
      <div className="mb-4 flex gap-2">
        <div className="h-3 w-12 rounded bg-surface-elevated" />
        <div className="h-3 w-3 rounded bg-surface-elevated" />
        <div className="h-3 w-20 rounded bg-surface-elevated" />
        <div className="h-3 w-3 rounded bg-surface-elevated" />
        <div className="h-3 w-32 rounded bg-surface-elevated" />
      </div>

      {/* Header */}
      <header className="border-t-2 border-border-strong pt-4">
        <div className="h-3 w-20 rounded bg-surface-elevated" />
        <div className="mt-3 space-y-3">
          <div className="h-9 w-full max-w-3xl rounded bg-surface-elevated" />
          <div className="h-9 w-4/5 max-w-3xl rounded bg-surface-elevated" />
          <div className="h-9 w-2/3 max-w-3xl rounded bg-surface-elevated" />
        </div>
        <div className="mt-4 h-5 w-2/3 max-w-xl rounded bg-surface-elevated" />
        <div className="mt-4 h-5 w-1/2 rounded bg-surface-elevated" />
        <div className="mt-4 flex gap-3 border-y border-border-subtle py-3">
          <div className="h-3 w-24 rounded bg-surface-elevated" />
          <div className="h-3 w-3 rounded bg-surface-elevated" />
          <div className="h-3 w-28 rounded bg-surface-elevated" />
          <div className="h-3 w-3 rounded bg-surface-elevated" />
          <div className="h-3 w-20 rounded bg-surface-elevated" />
        </div>
      </header>

      {/* Cover image */}
      <div className="mt-5 aspect-[16/9] rounded bg-surface-elevated" />

      {/* Body + sidebar */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="min-w-0 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-surface-elevated"
              style={{ width: `${85 + (i % 3) * 5}%` }}
            />
          ))}
          <div className="h-4 w-3/5 rounded bg-surface-elevated" />
          <div className="mt-2 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded bg-surface-elevated"
                style={{ width: `${75 + (i % 4) * 7}%` }}
              />
            ))}
          </div>
        </div>
        <div className="hidden space-y-6 lg:block">
          <div className="h-4 w-20 rounded bg-surface-elevated" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-full rounded bg-surface-elevated" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
