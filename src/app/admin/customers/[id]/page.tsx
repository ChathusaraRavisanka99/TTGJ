import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuoteStatusBadge, Badge } from "@/components/ui/Badge";
import { BackLink } from "@/components/admin/BackLink";
import { DisableUserControl } from "@/components/admin/DisableUserControl";
import { describeDisabled } from "@/lib/user-status";
import { formatPrice } from "@/lib/utils";

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SHIPPED: "bg-sapphire-soft/15 text-sapphire border-sapphire-soft/30",
  DELIVERED: "bg-gold-soft/25 text-charcoal border-gold/40",
  PAYMENT_FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
};

export default async function AdminCustomerDetailPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      quoteRequests: { orderBy: { createdAt: "desc" }, include: { gemstone: true, jewelry: true } },
      sourcingRequest: { orderBy: { createdAt: "desc" } },
      pointsTransactions: { orderBy: { createdAt: "desc" }, take: 10 },
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, status: true, total: true, currency: true, pointsRedeemed: true, pointsDiscountAmount: true, createdAt: true },
      },
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
      {customer.role !== "ADMIN" && (
        <div className="mt-2">
          <DisableUserControl userId={customer.id} name={customer.name ?? customer.email} status={describeDisabled(customer) ? { label: describeDisabled(customer)!, reason: customer.disabledReason } : null} />
        </div>
      )}
      <p className="mt-2 text-sm text-charcoal/60">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p>
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

      <div className="mt-8">
        <p className="font-serif text-xl text-charcoal">Orders</p>
        <div className="mt-3 space-y-2">
          {customer.orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-3 hover:border-gold"
            >
              <div>
                <span className="font-mono text-sm text-charcoal">{o.orderNumber}</span>
                <span className="ml-2 text-xs text-charcoal/50">{o.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                {o.pointsRedeemed > 0 && (
                  <span className="text-xs text-charcoal/60">{o.pointsRedeemed.toLocaleString()} pts used</span>
                )}
                <span className="text-sm text-charcoal">{formatPrice(o.total, o.currency === "LKR" ? "LKR" : "USD")}</span>
                <Badge className={ORDER_STATUS_STYLES[o.status] ?? ""}>{o.status.replaceAll("_", " ")}</Badge>
              </div>
            </Link>
          ))}
          {customer.orders.length === 0 && <p className="text-sm text-charcoal/50">No orders yet.</p>}
        </div>
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
