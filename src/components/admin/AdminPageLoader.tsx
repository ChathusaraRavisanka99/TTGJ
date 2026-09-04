/**
 * Suspense fallback for admin routes (see app/admin/loading.tsx) — plain CSS
 * animation only, no client/motion boundary needed. Sized to sit within the
 * content area beside AdminSidebar (which lives in admin/layout.tsx, outside
 * this Suspense boundary, so it stays visible and interactive while a page
 * loads instead of the whole panel flashing empty).
 */
export function AdminPageLoader() {
  return (
    // absolute inset-0, not a height/min-height — same reasoning as the
    // public PageLoader: this renders inside admin/layout.tsx's flex-1
    // content column (now `relative` for exactly this), and Chromium
    // doesn't reliably resolve a percentage-height child against a
    // flex-grown parent's layout size.
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-gold" />
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-charcoal/40">Loading</p>
    </div>
  );
}
