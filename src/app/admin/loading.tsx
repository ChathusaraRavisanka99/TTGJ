import { AdminPageLoader } from "@/components/admin/AdminPageLoader";

// Suspense fallback for every /admin/* route — shown in place of
// {children} inside admin/layout.tsx, so AdminSidebar stays visible and
// clickable while the next page's data loads.
export default function AdminLoading() {
  return <AdminPageLoader />;
}
