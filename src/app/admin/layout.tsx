import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { APP_PATH_HEADER } from "@/lib/market-shared";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Ratnavue Admin" }, robots: { index: false } };

// STAFF's one allowed area — kept in sync with proxy.ts's own copy of this
// list (the edge-layer gate); this is the defense-in-depth re-check every
// other server entry point in this app already does, not the only check.
const STAFF_ALLOWED_PATHS = ["/admin/orders"];

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
  const pathname = (await headers()).get(APP_PATH_HEADER) ?? "";
  const staffAllowed = session.user.role === "STAFF" && STAFF_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (session.user.role !== "ADMIN" && !staffAllowed) {
    redirect("/unauthorized");
  }

  return (
    // flex-col (mobile top bar, then content stacked) below lg, flex-row
    // (permanent sidebar beside content) at lg+ — see AdminSidebar for the
    // matching responsive split of its own markup. Unconditionally flex
    // (not `lg:flex`) is what actually matters here, not the direction:
    // the content column below needs to be a flex item at every
    // breakpoint so `flex-1` gives it a definite height for
    // AdminPageLoader's `absolute inset-0` to fill — a plain block box's
    // height is derived from its in-flow children, and during the
    // loading fallback its only child is that same `absolute` (so
    // flow-height-contributing-zero) loader, collapsing the whole column
    // to just its own padding. Verified live: below lg this was rendering
    // the spinner squashed into a ~48px strip under the mobile top bar
    // instead of filling the screen.
    <div className="flex min-h-[calc(100vh-1px)] flex-col bg-ivory-soft print:block print:bg-white lg:flex-row">
      <AdminSidebar role={session.user.role} />
      {/* relative: lets AdminPageLoader (the Suspense fallback — see
          admin/loading.tsx) cover this box exactly via `absolute inset-0`
          — see the matching comment on MainWrapper's <main> for why a
          percentage height on the loader itself isn't reliable here. */}
      <div className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">{children}</div>
    </div>
  );
}
