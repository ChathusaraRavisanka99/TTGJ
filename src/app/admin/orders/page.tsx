import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";
import { OrderActions } from "@/components/admin/OrderActions";
import { ShipOrderForm } from "@/components/admin/ShipOrderForm";
import { MarkDeliveredButton } from "@/components/admin/MarkDeliveredButton";
import { CartContentForm } from "@/components/admin/CartContentForm";
import { getPageContent, DEFAULT_LK_PAYMENTS_CONTENT, LK_PAYMENTS_KEY } from "@/lib/page-content";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUSES = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED", "PAYMENT_FAILED", "CANCELLED"];
const PAGE_SIZE = 20;
const METHOD_LABELS: Record<string, string> = { PAYHERE_CARD: "Card (PayHere)", WIRE_TRANSFER: "Bank transfer", COD: "Cash on delivery" };

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SHIPPED: "bg-sapphire-soft/15 text-sapphire border-sapphire-soft/30",
  DELIVERED: "bg-gold-soft/25 text-charcoal border-gold/40",
  PAYMENT_FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
};

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const market = sp.market === "lk" ? "lk" : sp.market === "intl" ? "intl" : undefined;
  const where = { ...(status ? { status: status as never } : {}), ...(market ? { market } : {}) };
  const [orders, total, lkPayments] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true },
    }),
    prisma.order.count({ where }),
    getPageContent(LK_PAYMENTS_KEY, DEFAULT_LK_PAYMENTS_CONTENT),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Retail Orders</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Direct-purchase orders: card payments settle automatically through PayHere; Sri Lanka store bank transfers stay
        pending (their items held) until you mark them paid once the money arrives.
      </p>

      <div className="mt-6">
        <CartContentForm variant="lk" initialInstructions={lkPayments.wireTransferInstructions} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {([["All stores", undefined], ["International", "intl"], ["Sri Lanka", "lk"]] as const).map(([label, value]) => (
          <Link
            key={label}
            href={`/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), ...(value ? { market: value } : {}) }).toString()}`}
            className={cn("rounded-full border px-3 py-1 text-xs", market === value ? "border-gold-deep bg-gold/20 text-charcoal" : "border-border-subtle text-charcoal/70")}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/admin/orders${market ? `?market=${market}` : ""}`} className={cn("rounded-full border px-3 py-1 text-xs", !status ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}${market ? `&market=${market}` : ""}`}
            className={cn("rounded-full border px-3 py-1 text-xs", status === s ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}
          >
            {s.replaceAll("_", " ")}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Shipping To</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3 font-mono text-charcoal">
                  <Link href={`/admin/orders/${o.id}`} className="hover:text-gold-deep hover:underline">{o.orderNumber}</Link>
                  {(o.quoteRequestId || o.sourcingRequestId) && (
                    <span className="ml-2 rounded-full border border-border-subtle px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide text-charcoal/55">
                      {o.quoteRequestId ? "Quote" : "Sourcing"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-charcoal/70">{o.user.email}</td>
                <td className="px-4 py-3 text-charcoal/70">{o.market === "lk" ? "Sri Lanka" : "International"}</td>
                <td className="px-4 py-3 text-charcoal/70">{METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod}</td>
                <td className="px-4 py-3 text-charcoal/70">{formatPrice(o.total, o.currency === "LKR" ? "LKR" : "USD")}{o.currency === "LKR" ? "" : ` ${o.currency}`}</td>
                <td className="px-4 py-3 text-charcoal/70">{o.needsShippingDetails ? "—" : `${o.shipCity}, ${o.shipCountry}`}</td>
                <td className="px-4 py-3 text-charcoal/70">{o.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3"><Badge className={STATUS_STYLES[o.status] ?? ""}>{o.status.replaceAll("_", " ")}</Badge></td>
                <td className="px-4 py-3">
                  {o.needsShippingDetails && <p className="text-xs text-charcoal/60">Awaiting customer&apos;s shipping details</p>}
                  {!o.needsShippingDetails && o.status === "PENDING_PAYMENT" && o.paymentMethod === "WIRE_TRANSFER" && <OrderActions orderId={o.id} orderNumber={o.orderNumber} />}
                  {!o.needsShippingDetails && o.status === "PAID" && <ShipOrderForm orderId={o.id} orderNumber={o.orderNumber} />}
                  {o.status === "SHIPPED" && (
                    <div className="space-y-1">
                      <p className="text-xs text-charcoal/60">{o.carrier} · {o.trackingNumber}</p>
                      <MarkDeliveredButton orderId={o.id} orderNumber={o.orderNumber} />
                    </div>
                  )}
                  {o.status === "DELIVERED" && o.deliveredAt && (
                    <p className="text-xs text-charcoal/60">Delivered {o.deliveredAt.toLocaleDateString()}</p>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-charcoal/50">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
