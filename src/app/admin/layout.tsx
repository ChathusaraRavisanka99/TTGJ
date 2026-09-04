import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Ratnavue Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  // Defense in depth: middleware already gates /admin, but every server
  // entry point re-checks so nothing depends solely on the edge layer.
  // Same split as middleware.ts: no session at all -> prompt sign-in;
  // signed in but the wrong role -> the themed access-denied page, not a
  // login prompt they can't do anything useful with.
  if (!session?.user) {
    redirect("/account/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    // Block-stacked (mobile top bar, then content) below lg, side-by-side
    // flex row (permanent sidebar) at lg+ — see AdminSidebar for the
    // matching responsive split of its own markup.
    <div className="min-h-[calc(100vh-1px)] bg-ivory-soft print:block print:bg-white lg:flex">
      <AdminSidebar />
      {/* relative: lets AdminPageLoader (the Suspense fallback — see
          admin/loading.tsx) cover this box exactly via `absolute inset-0`
          — see the matching comment on MainWrapper's <main> for why a
          percentage height on the loader itself isn't reliable here. */}
      <div className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">{children}</div>
    </div>
  );
}
