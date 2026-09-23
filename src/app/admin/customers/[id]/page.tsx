import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuoteStatusBadge, Badge } from "@/components/ui/Badge";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminCustomerDetailPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      quoteRequests: { orderBy: { createdAt: "desc" }, include: { gemstone: true, jewelry: true } },
      sourcingRequest: { orderBy: { createdAt: "desc" } },
      pointsTransactions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!customer) notFound();

  return (
    <div className="max-w-6xl">
      <BackLink href="/admin/customers" label="Back to Customers" />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl text-charcoal">{customer.name}</h1>
        <Badge className={customer.customerType === "WHOLESALE" ? "border-gold/40 bg-gold/15 text-charcoal" : "border-border-subtle bg-charcoal/5 text-charcoal/70"}>
          {customer.customerType === "WHOLESALE" ? "Wholesale" : "Retail"}
        </Badge>
      </div>
      <p className="text-sm text-charcoal/60">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p>
      <p className="mt-1 text-xs text-charcoal/45">Joined {customer.createdAt.toLocaleDateString()}</p>
      {customer.customerType === "WHOLESALE" && (
        <p className="mt-1 text-xs text-charcoal/60">
          {customer.businessName ?? "—"}{customer.businessRegNo ? ` · Reg. ${customer.businessRegNo}` : ""}
          {customer.wholesaleStatus && ` · ${customer.wholesaleStatus.charAt(0)}${customer.wholesaleStatus.slice(1).toLowerCase()}`}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5">
        <p className="text-xs uppercase tracking-wide text-charcoal/65">Rewards points</p>
        <p className="mt-1 font-serif text-2xl text-charcoal">{customer.pointsBalance.toLocaleString()}</p>
        {customer.pointsTransactions.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-border-subtle pt-3">
            {customer.pointsTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between text-sm">
                <span className="text-charcoal/70">{tx.reason.replaceAll("_", " ")}</span>
                <span className={tx.amount >= 0 ? "text-emerald-700" : "text-charcoal/70"}>{tx.amount >= 0 ? "+" : ""}{tx.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="font-serif text-xl text-charcoal">Quote Requests</p>
          <div className="mt-3 space-y-2">
            {customer.quoteRequests.map((q) => (
              <Link key={q.id} href={`/admin/quotes/${q.id}`} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 hover:border-gold">
                <span className="text-sm text-charcoal">{q.gemstone?.name ?? q.jewelry?.name ?? "Configured gem"}</span>
                <QuoteStatusBadge status={q.status} />
              </Link>
            ))}
            {customer.quoteRequests.length === 0 && <p className="text-sm text-charcoal/50">No quote requests.</p>}
          </div>
        </div>

        <div>
          <p className="font-serif text-xl text-charcoal">Sourcing Requests</p>
          <div className="mt-3 space-y-2">
            {customer.sourcingRequest.map((r) => (
              <Link key={r.id} href={`/admin/sourcing/${r.id}`} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 hover:border-gold">
                <span className="text-sm text-charcoal">{r.mineralDescription}</span>
                <QuoteStatusBadge status={r.status} />
              </Link>
            ))}
            {customer.sourcingRequest.length === 0 && <p className="text-sm text-charcoal/50">No sourcing requests.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
