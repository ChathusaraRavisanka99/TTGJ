import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMarket } from "@/lib/market";
import { getHubCounts } from "@/lib/account-hub";
import { AccountSidebar } from "@/components/account/AccountSidebar";

// The signed-in account area: a left rail (a tab strip on phones) shared by
// every page in it — overview, orders, messages, requests, cart. Sign-in and
// registration sit outside this route group, so they stay full-width.
export default async function AccountHubLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // proxy.ts already sends signed-out visitors to the login page; this is only
  // a safety net so a missing session never renders an empty shell.
  if (!session?.user) return <>{children}</>;

  const market = await getMarket();
  const [counts, user] = await Promise.all([
    getHubCounts(session.user.id, market),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { businessRole: true } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 lg:py-12">
      <AccountSidebar
        user={{ name: session.user.name, email: session.user.email }}
        counts={counts}
        showBusiness={user.businessRole != null}
      />
      <div className="mt-6 min-w-0 lg:mt-0">{children}</div>
    </div>
  );
}
