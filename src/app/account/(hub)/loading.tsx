// Shown inside the account area's content column while a page in it loads, so
// the sidebar stays put instead of the whole screen being replaced by the
// site-wide loader on every click between account pages.
export default function AccountLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading" className="animate-pulse">
      <div className="h-3 w-40 rounded bg-ivory-soft" />
      <div className="mt-6 h-8 w-64 rounded bg-ivory-soft" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border-subtle bg-surface p-5">
            <div className="h-4 w-1/3 rounded bg-ivory-soft" />
            <div className="mt-3 h-3 w-2/3 rounded bg-ivory-soft" />
            <div className="mt-2 h-3 w-1/2 rounded bg-ivory-soft" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
