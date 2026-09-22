import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import NextLink from "next/link";
import { Gem } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markNotificationsReadForRequest } from "@/lib/notifications";
import { Badge } from "@/components/ui/Badge";
import { BackLink } from "@/components/admin/BackLink";
import { OrderShippingDetailsForm } from "@/components/account/OrderShippingDetailsForm";
import { formatPrice } from "@/lib/utils";
import { withMarket, type Market } from "@/lib/market-shared";

export const metadata: Metadata = { title: "Order Details" };

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
};

// The full record of one order: every item, the complete price breakdown
// (not just the total OrderCard shows), payment info, and the shipping
// address it was placed with. Reachable by clicking an order anywhere in the
// account hub (the orders list, the overview's "Recent Orders").
export default async function AccountOrderDetailPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null; // proxy.ts guards this route

  const [order, t] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            gemstone: { select: { name: true, slug: true, media: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
            jewelry: { select: { name: true, slug: true, media: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
          },
        },
        discountCode: { select: { code: true } },
      },
    }),
    getTranslations("orders"),
  ]);
  // Same "not found" whether the id is wrong or belongs to someone else —
  // never confirms a guessed id exists but isn't theirs — as every other
  // owned-resource detail page here (quotes, sourcing).
  if (!order || order.userId !== session.user.id) notFound();

  await markNotificationsReadForRequest("order", order.id, session.user.id);

  const currency = order.currency === "LKR" ? "LKR" : "USD";
  const market = (order.market === "lk" ? "lk" : "intl") as Market;

  const summaryRows: { label: string; value: string }[] = [
    { label: t("detail.subtotal"), value: formatPrice(order.subtotal, currency) },
  ];
  if (order.discountAmount > 0) {
    summaryRows.push({
      label: order.discountCode ? `${t("detail.discount")} (${order.discountCode.code})` : t("detail.discount"),
      value: `−${formatPrice(order.discountAmount, currency)}`,
    });
  }
  if (order.birthdayDiscountAmount > 0) summaryRows.push({ label: t("detail.birthday"), value: `−${formatPrice(order.birthdayDiscountAmount, currency)}` });
  if (order.pointsDiscountAmount > 0) summaryRows.push({ label: `${t("detail.points")} (${order.pointsRedeemed})`, value: `−${formatPrice(order.pointsDiscountAmount, currency)}` });
  if (order.taxAmount > 0) summaryRows.push({ label: t("detail.tax"), value: formatPrice(order.taxAmount, currency) });
  summaryRows.push({ label: t("detail.shipping"), value: formatPrice(order.shippingAmount, currency) });
  if (order.handlingFeeAmount > 0) summaryRows.push({ label: t("detail.handling"), value: formatPrice(order.handlingFeeAmount, currency) });

  return (
    <div className="w-full">
      <BackLink href="/account/orders" label={t("detail.backToOrders")} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold-deep">{t("detail.kicker")}</p>
          <h1 className="mt-2 font-mono text-2xl text-charcoal sm:text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-charcoal/60">{t("placed", { date: order.createdAt.toLocaleDateString() })}</p>
        </div>
        <Badge className={STATUS_STYLES[order.status] ?? ""}>{t(`status.${order.status}`)}</Badge>
      </div>

      {order.needsShippingDetails && (
        <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-5">
          <OrderShippingDetailsForm orderId={order.id} />
        </div>
      )}

      {!order.needsShippingDetails && order.status === "PENDING_PAYMENT" && (
        <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-4">
          <NextLink
            href={withMarket(order.paymentMethod === "WIRE_TRANSFER" ? `/checkout/wire?order=${order.id}` : `/checkout/return?order=${order.id}`, market)}
            className="inline-flex items-center rounded-full border border-gold bg-surface px-4 py-1.5 text-sm font-medium text-charcoal transition-colors hover:bg-gold/25"
          >
            {order.paymentMethod === "WIRE_TRANSFER" ? t("paymentInstructions") : t("detail.completePayment")}
          </NextLink>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <p className="border-b border-border-subtle px-5 py-3 text-xs font-medium uppercase tracking-wide text-charcoal/65">{t("detail.items")}</p>
            <div className="divide-y divide-border-subtle px-5">
              {order.items.map((item) => {
                const product = item.gemstone ?? item.jewelry;
                const href = product ? withMarket(`/${item.gemstone ? "gems" : "jewelry"}/${product.slug}`, market) : null;
                const image = product?.media[0]?.url;
                const thumb = (
                  <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ivory-soft">
                    {image ? <Image src={image} alt="" fill sizes="64px" className="object-cover" /> : <Gem size={22} strokeWidth={1} className="text-charcoal/25" />}
                  </span>
                );
                return (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    {href ? <NextLink href={href}>{thumb}</NextLink> : thumb}
                    <div className="min-w-0 flex-1">
                      {href ? (
                        <NextLink href={href} className="text-sm font-medium text-charcoal hover:text-gold-deep">{item.label}</NextLink>
                      ) : (
                        <p className="text-sm font-medium text-charcoal">{item.label}</p>
                      )}
                      <p className="mt-0.5 text-xs text-charcoal/60">{formatPrice(item.unitPrice, currency)} × {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm text-charcoal">{formatPrice(item.lineTotal, currency)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
            <section className="rounded-xl border border-border-subtle bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">{t("detail.tracking")}</p>
              <dl className="mt-3 space-y-2 text-sm">
                {order.carrier && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-charcoal/60">{t("detail.carrier")}</dt>
                    <dd className="text-charcoal">{order.carrier}</dd>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-charcoal/60">{t("detail.trackingNumber")}</dt>
                    <dd className="text-charcoal">
                      {order.trackingUrl ? (
                        <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-gold-deep underline-offset-2 hover:underline">
                          {order.trackingNumber}
                        </a>
                      ) : (
                        order.trackingNumber
                      )}
                    </dd>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-charcoal/60">{t("status.SHIPPED")}</dt>
                    <dd className="text-charcoal">{order.shippedAt.toLocaleDateString()}</dd>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-charcoal/60">{t("status.DELIVERED")}</dt>
                    <dd className="text-charcoal">{order.deliveredAt.toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {!order.needsShippingDetails && (
            <section className="rounded-xl border border-border-subtle bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">{t("detail.shippingAddress")}</p>
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
            </section>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <section className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">{t("detail.total")}</p>
            <div className="mt-3 space-y-1.5 text-sm text-charcoal/75">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-border-subtle pt-3">
              <span className="text-sm font-medium text-charcoal">{t("detail.total")}</span>
              <span className="font-serif text-xl text-charcoal">{formatPrice(order.total, currency)}</span>
            </div>
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">{t("detail.paymentInfo")}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-charcoal/60">{t("detail.method")}</dt>
                <dd className="text-charcoal">{METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd>
              </div>
              {order.gatewayPaymentId && (
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/60">{t("detail.reference")}</dt>
                  <dd className="truncate text-charcoal">{order.gatewayPaymentId}</dd>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/60">{t("status.PAID")}</dt>
                  <dd className="text-charcoal">{order.paidAt.toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
