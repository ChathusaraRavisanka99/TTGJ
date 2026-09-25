// Shown while a catalog page's results load after a filter/sort/page change —
// the navigation-wide loader only fires when the route itself changes, so
// without this the old results just sit there for a moment.
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <div className="aspect-square bg-ivory-soft" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 rounded bg-ivory-soft" />
              <div className="h-4 w-3/4 rounded bg-ivory-soft" />
              <div className="h-3 w-1/2 rounded bg-ivory-soft" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
