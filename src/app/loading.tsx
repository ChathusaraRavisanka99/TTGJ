import { PageLoader } from "@/components/layout/PageLoader";

// Automatic Suspense fallback for every route under this segment (i.e. the
// whole public site) — Next.js shows this the moment a navigation's data
// fetch takes long enough to be visible, no manual loading-state wiring
// needed per page. Renders inside MainWrapper's <main>, so the fixed
// Navbar/Footer stay in place around it — and behind NavigationOverlay
// (see SiteChrome), which blurs the outgoing page from the moment a link
// is clicked, so if this is still showing by the time that blur clears
// it just reads through it like everything else on the page does.
export default function Loading() {
  return <PageLoader />;
}
