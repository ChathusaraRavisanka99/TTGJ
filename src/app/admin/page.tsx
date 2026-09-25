import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasStaffArea, marketFilterFor } from "@/lib/rbac";
import { getAuctionDisplayState } from "@/lib/auctions";

// One page for two audiences. An ADMIN sees everything. A STAFF member with
// the "dashboard" area sees only the figures for their own store(s), and
// only the parts of the back office they also have (quote counts need the
// "requests" area, and so on); business-wide numbers — customers, auctions —
// stay admin-only. A single-store member never sees the other store's totals.
export default async function AdminDashboardPage() {
  const user = (await auth())?.user;
  if (!user || !hasStaffArea(user, "dashboard")) notFound();

  const isAdmin = user.role === "ADMIN";
  const scoped = marketFilterFor(user);
  const inMarket = scoped ? { market: scoped } : {};
  const can = (area: "orders" | "catalog" | "requests") => hasStaffArea(user, area);
  const scopeLabel = scoped === "lk" ? "Sri Lanka store" : scoped === "intl" ? "International store" : "both stores";

  const showRequests = can("requests");
  const [gemCount, jewelryCount, soldGems, pendingOrders, newQuotes, newSourcing, customerCount, recentQuotes, recentSourcing, closedActiveAuctions] = await Promise.all([
    prisma.gemstone.count({ where: inMarket }),
    prisma.jewelryPiece.count({ where: inMarket }),
    prisma.gemstone.count({ where: { stockStatus: "SOLD", ...inMarket } }),
    prisma.order.count({ where: { status: "PENDING_PAYMENT", ...inMarket } }),
    showRequests ? prisma.quoteRequest.count({ where: { status: "SUBMITTED" } }) : Promise.resolve(0),
    showRequests ? prisma.sourcingRequest.count({ where: { status: "SUBMITTED" } }) : Promise.resolve(0),
    isAdmin ? prisma.user.count({ where: { role: "CUSTOMER" } }) : Promise.resolve(0),
    showRequests ? prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true, gemstone: true, jewelry: true } }) : Promise.resolve([]),
    showRequests ? prisma.sourcingRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } }) : Promise.resolve([]),
    // Effective state is computed, not stored (see lib/auctions.ts), so
    // "awaiting confirmation" can't be a plain `where` filter — pull every
    // closed-but-still-Active auction and count in JS. Cheap at this
    // site's expected auction volume.
    isAdmin ? prisma.auction.findMany({ where: { status: "ACTIVE", endsAt: { lt: new Date() } }, include: { bids: true } }) : Promise.resolve([]),
  ]);
  const awaitingConfirmation = closedActiveAuctions.filter((a) => getAuctionDisplayState(a) === "AWAITING_CONFIRMATION").length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Dashboard</h1>
      {!isAdmin && <p className="mt-1 text-sm text-charcoal/65">Showing figures for the {scopeLabel}.</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {showRequests && <StatCard label="New Quote Requests" value={newQuotes} href="/admin/quotes?status=SUBMITTED" highlight />}
        {showRequests && <StatCard label="New Sourcing Requests" value={newSourcing} href="/admin/sourcing?status=SUBMITTED" highlight />}
        {isAdmin && <StatCard label="Auctions Awaiting Confirmation" value={awaitingConfirmation} href="/admin/auctions" highlight />}
        <StatCard label="Orders Awaiting Payment" value={pendingOrders} href={can("orders") ? "/admin/orders?status=PENDING_PAYMENT" : undefined} highlight />
        <StatCard label="Gemstones in Catalog" value={gemCount} href={can("catalog") ? "/admin/gems" : undefined} />
        <StatCard label="Jewelry in Catalog" value={jewelryCount} href={can("catalog") ? "/admin/jewelry" : undefined} />
        <StatCard label="Sold Gemstones (cleanup)" value={soldGems} href={can("catalog") ? "/admin/gems?stockStatus=SOLD" : undefined} />
        {isAdmin && <StatCard label="Registered Customers" value={customerCount} href="/admin/customers" />}
      </div>

      {showRequests && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg text-charcoal">Recent Quote Requests</p>
              <Link href="/admin/quotes" className="text-xs text-charcoal/65 underline">View all</Link>
            </div>
            <ul className="mt-4 space-y-3">
              {recentQuotes.map((q) => (
                <li key={q.id} className="text-sm">
                  <Link href={`/admin/quotes/${q.id}`} className="text-charcoal hover:text-gold">
                    {q.gemstone?.name ?? q.jewelry?.name ?? "Configured gem"}
                  </Link>
                  <span className="text-charcoal/65"> — {q.user.email} — {q.status.replaceAll("_", " ")}</span>
                </li>
              ))}
              {recentQuotes.length === 0 && <p className="text-sm text-charcoal/65">No quote requests yet.</p>}
            </ul>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-serif text-lg text-charcoal">Recent Sourcing Requests</p>
              <Link href="/admin/sourcing" className="text-xs text-charcoal/65 underline">View all</Link>
            </div>
            <ul className="mt-4 space-y-3">
              {recentSourcing.map((r) => (
                <li key={r.id} className="text-sm">
                  <Link href={`/admin/sourcing/${r.id}`} className="text-charcoal hover:text-gold">
                    {r.mineralDescription}
                  </Link>
                  <span className="text-charcoal/65"> — {r.user.email} — {r.status.replaceAll("_", " ")}</span>
                </li>
              ))}
              {recentSourcing.length === 0 && <p className="text-sm text-charcoal/65">No sourcing requests yet.</p>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, href, highlight }: { label: string; value: number; href?: string; highlight?: boolean }) {
  const className = `rounded-xl border p-5 transition-shadow ${href ? "hover:shadow-md" : ""} ${
    highlight && value > 0 ? "border-gold/40 bg-gold-soft/15" : "border-border-subtle bg-surface"
  }`;
  const body = (
    <>
      <p className="font-serif text-3xl text-charcoal">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-charcoal/65">{label}</p>
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
