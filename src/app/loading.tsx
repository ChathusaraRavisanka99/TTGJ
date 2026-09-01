import { PageLoader } from "@/components/layout/PageLoader";

// Automatic Suspense fallback for every route under this segment (i.e. the
// whole public site) — Next.js shows this the moment a navigation's data
// fetch takes long enough to be visible, no manual loading-state wiring
// needed per page. Renders inside MainWrapper's <main>, so the fixed
// Navbar/Footer stay in place around it.
export default function Loading() {
  return <PageLoader />;
}
