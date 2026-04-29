/**
 * Category page loading skeleton.
 */
export default function CategoryLoading() {
  return (
    <div className="newspaper-shell animate-pulse py-8" aria-hidden="true">
      {/* Category header */}
      <div className="mb-8 border-b border-border-subtle pb-6">
        <div className="h-3 w-16 rounded bg-surface-elevated" />
        <div className="mt-3 h-10 w-64 rounded bg-surface-elevated" />
        <div className="mt-3 h-4 w-1/3 rounded bg-surface-elevated" />
      </div>
      {/* Article grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
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
