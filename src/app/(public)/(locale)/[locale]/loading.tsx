/**
 * Generic locale-level loading skeleton.
 * Shows while any page in this segment is fetching server data.
 * Overridden by more specific loading.tsx files in sub-segments.
 */
export default function LocaleLoading() {
  return (
    <div className="newspaper-shell py-10 animate-pulse" aria-hidden="true">
      {/* Hero skeleton */}
      <div className="mb-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="aspect-[16/9] rounded bg-surface-elevated" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-20 rounded bg-surface-elevated" />
          <div className="h-7 w-full rounded bg-surface-elevated" />
          <div className="h-7 w-4/5 rounded bg-surface-elevated" />
          <div className="h-4 w-2/3 rounded bg-surface-elevated" />
          <div className="mt-auto h-3 w-1/3 rounded bg-surface-elevated" />
        </div>
      </div>
      {/* Card grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[16/9] rounded bg-surface-elevated" />
            <div className="h-3 w-16 rounded bg-surface-elevated" />
            <div className="h-5 w-full rounded bg-surface-elevated" />
            <div className="h-5 w-3/4 rounded bg-surface-elevated" />
            <div className="h-3 w-1/2 rounded bg-surface-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
