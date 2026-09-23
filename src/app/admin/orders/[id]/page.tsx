import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pollChatMessages } from "@/actions/chat";
import { Badge } from "@/components/ui/Badge";
import { BackLink } from "@/components/admin/BackLink";
import { OrderActions } from "@/components/admin/OrderActions";
import { ShipOrderForm } from "@/components/admin/ShipOrderForm";
import { MarkDeliveredButton } from "@/components/admin/MarkDeliveredButton";
import { ClearShippingToBeArrangedButton } from "@/components/admin/ClearShippingToBeArrangedButton";
import { RefundResolutionPanel } from "@/components/admin/RefundResolutionPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { formatPrice } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SHIPPED: "bg-sapphire-soft/15 text-sapphire border-sapphire-soft/30",
  DELIVERED: "bg-gold-soft/25 text-charcoal border-gold/40",
  PAYMENT_FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
};

const METHOD_LABELS: Record<string, string> = {
  PAYHERE_CARD: "Card (PayHere)",
  WIRE_TRANSFER: "Bank transfer",
  COD: "Cash on delivery",
  CASH: "Cash",
};

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const [order, session] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: {
            gemstone: { select: { name: true, slug: true, media: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
            jewelry: { select: { name: true, slug: true, media: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
          },
        },
        refundRequest: true,
      },
    }),
    auth(),
  ]);
  if (!order) notFound();

  const initialMessages = await pollChatMessages("order", id);
  const currency = order.currency === "LKR" ? "LKR" : "USD";

  return (
    <div className="max-w-6xl">
      <BackLink href="/admin/orders" label="Back to Orders" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl text-charcoal">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-charcoal/60">{order.user.name ?? order.user.email} · {order.user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {order.manualSale && (
            <Badge className="border-sapphire-soft/30 bg-sapphire-soft/15 text-sapphire">Manual Sale</Badge>
          )}
          <Badge className={STATUS_STYLES[order.status] ?? ""}>{order.status.replaceAll("_", " ")}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <p className="border-b border-border-subtle px-5 py-3 text-xs font-medium uppercase tracking-wide text-charcoal/65">Items</p>
            <div className="divide-y divide-border-subtle px-5">
              {order.items.map((item) => {
                const product = item.gemstone ?? item.jewelry;
                const image = product?.media[0]?.url;
                return (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ivory-soft">
                      {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-charcoal">{item.label}</p>
                      <p className="mt-0.5 text-xs text-charcoal/60">{formatPrice(item.unitPrice, currency)} × {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm text-charcoal">{formatPrice(item.lineTotal, currency)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">Shipping Address</p>
            {order.needsShippingDetails ? (
              <p className="mt-2 text-sm text-charcoal/60">Awaiting the customer&apos;s shipping details.</p>
            ) : (
              <address className="mt-2 text-sm not-italic leading-relaxed text-charcoal/80">
                {order.shipName}
                <br />
                {order.shipAddressLine1}
                {order.shipAddressLine2 && (
                  <>
                    <br />
                    {order.shipAddressLine2}
                  </>
                )}
                <br />
                {order.shipCity}
                {order.shipPostalCode ? ` ${order.shipPostalCode}` : ""}
                <br />
                {order.shipCountry}
                <br />
                {order.shipPhone}
              </address>
            )}
          </div>

          {session?.user && (
            <ChatPanel requestType="order" requestId={order.id} currentUserId={session.user.id} initialMessages={initialMessages} hasOpenCart={false} />
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">Total</p>
            <p className="mt-2 font-serif text-xl text-charcoal">{formatPrice(order.total, currency)}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-charcoal/60">Payment method</dt>
                <dd className="text-charcoal">{METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd>
              </div>
              {order.carrier && (
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/60">Carrier</dt>
                  <dd className="text-charcoal">{order.carrier} · {order.trackingNumber}</dd>
                </div>
              )}
              {order.manualPaymentReference && (
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/60">Payment reference</dt>
                  <dd className="text-charcoal">{order.manualPaymentReference}</dd>
                </div>
              )}
              {order.manualReceiptUrl && (
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/60">Receipt</dt>
                  <dd>
                    <a href={order.manualReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-gold-deep underline hover:text-charcoal">
                      View file
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">Actions</p>
            <div className="mt-3 space-y-3">
              {order.shippingToBeArranged && <ClearShippingToBeArrangedButton orderId={order.id} />}
              {order.needsShippingDetails && <p className="text-xs text-charcoal/60">Awaiting customer&apos;s shipping details.</p>}
              {!order.needsShippingDetails && order.status === "PENDING_PAYMENT" && order.paymentMethod === "WIRE_TRANSFER" && (
                <OrderActions orderId={order.id} orderNumber={order.orderNumber} />
              )}
              {!order.needsShippingDetails && order.status === "PAID" && <ShipOrderForm orderId={order.id} orderNumber={order.orderNumber} />}
              {order.status === "SHIPPED" && <MarkDeliveredButton orderId={order.id} orderNumber={order.orderNumber} />}
            </div>
          </div>

          {order.refundRequest && (
            <RefundResolutionPanel orderId={order.id} refund={order.refundRequest} currency={order.currency === "LKR" ? "LKR" : "USD"} />
          )}
        </div>
      </div>
    </div>
  );
}
