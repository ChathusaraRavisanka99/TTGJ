/**
 * Suspense fallback for admin routes (see app/admin/loading.tsx) — plain CSS
 * animation only, no client/motion boundary needed. Sized to sit within the
 * content area beside AdminSidebar (which lives in admin/layout.tsx, outside
 * this Suspense boundary, so it stays visible and interactive while a page
 * loads instead of the whole panel flashing empty).
 */
export function AdminPageLoader() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-gold" />
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-charcoal/40">Loading</p>
    </div>
  );
}
