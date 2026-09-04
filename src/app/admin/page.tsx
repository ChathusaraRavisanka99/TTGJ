import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuctionDisplayState } from "@/lib/auctions";

export default async function AdminDashboardPage() {
  const [
    gemCount,
    jewelryCount,
    newQuotes,
    newSourcing,
    soldGems,
    customerCount,
    recentQuotes,
    recentSourcing,
    closedActiveAuctions,
  ] = await Promise.all([
    prisma.gemstone.count(),
    prisma.jewelryPiece.count(),
    prisma.quoteRequest.count({ where: { status: "SUBMITTED" } }),
    prisma.sourcingRequest.count({ where: { status: "SUBMITTED" } }),
    prisma.gemstone.count({ where: { stockStatus: "SOLD" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true, gemstone: true, jewelry: true } }),
    prisma.sourcingRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } }),
    // Effective state is computed, not stored (see lib/auctions.ts), so
    // "awaiting confirmation" can't be a plain `where` filter — pull every
    // closed-but-still-Active auction and count in JS. Cheap at this
    // site's expected auction volume.
    prisma.auction.findMany({ where: { status: "ACTIVE", endsAt: { lt: new Date() } }, include: { bids: true } }),
  ]);
  const awaitingConfirmation = closedActiveAuctions.filter((a) => getAuctionDisplayState(a) === "AWAITING_CONFIRMATION").length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New Quote Requests" value={newQuotes} href="/admin/quotes?status=SUBMITTED" highlight />
        <StatCard label="New Sourcing Requests" value={newSourcing} href="/admin/sourcing?status=SUBMITTED" highlight />
        <StatCard label="Auctions Awaiting Confirmation" value={awaitingConfirmation} href="/admin/auctions" highlight />
        <StatCard label="Gemstones in Catalog" value={gemCount} href="/admin/gems" />
        <StatCard label="Jewelry in Catalog" value={jewelryCount} href="/admin/jewelry" />
        <StatCard label="Sold Gemstones (cleanup)" value={soldGems} href="/admin/gems?stockStatus=SOLD" />
        <StatCard label="Registered Customers" value={customerCount} href="/admin/customers" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg text-charcoal">Recent Quote Requests</p>
            <Link href="/admin/quotes" className="text-xs text-charcoal/60 underline">View all</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentQuotes.map((q) => (
              <li key={q.id} className="text-sm">
                <Link href={`/admin/quotes/${q.id}`} className="text-charcoal hover:text-gold">
                  {q.gemstone?.name ?? q.jewelry?.name ?? "Configured gem"}
                </Link>
                <span className="text-charcoal/50"> — {q.user.email} — {q.status.replaceAll("_", " ")}</span>
              </li>
            ))}
            {recentQuotes.length === 0 && <p className="text-sm text-charcoal/50">No quote requests yet.</p>}
          </ul>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg text-charcoal">Recent Sourcing Requests</p>
            <Link href="/admin/sourcing" className="text-xs text-charcoal/60 underline">View all</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentSourcing.map((r) => (
              <li key={r.id} className="text-sm">
                <Link href={`/admin/sourcing/${r.id}`} className="text-charcoal hover:text-gold">
                  {r.mineralDescription}
                </Link>
                <span className="text-charcoal/50"> — {r.user.email} — {r.status.replaceAll("_", " ")}</span>
              </li>
            ))}
            {recentSourcing.length === 0 && <p className="text-sm text-charcoal/50">No sourcing requests yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
        highlight && value > 0 ? "border-gold/40 bg-gold-soft/15" : "border-border-subtle bg-surface"
      }`}
    >
      <p className="font-serif text-3xl text-charcoal">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-charcoal/55">{label}</p>
    </Link>
  );
}
