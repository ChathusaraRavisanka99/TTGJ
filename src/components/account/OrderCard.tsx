import type { Prisma } from "@prisma/client";
import NextLink from "next/link";
import Image from "next/image";
import { Gem } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, cn } from "@/lib/utils";
import { getMarket } from "@/lib/market";
import { withMarket, type Market } from "@/lib/market-shared";

export const orderCardInclude = {
  items: {
    include: {
      gemstone: { select: { slug: true, media: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
      jewelry: { select: { slug: true, media: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderForCard = Prisma.OrderGetPayload<{ include: typeof orderCardInclude }>;

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SHIPPED: "bg-sapphire-soft/15 text-sapphire border-sapphire-soft/30",
  DELIVERED: "bg-gold-soft/25 text-charcoal border-gold/40",
  PAYMENT_FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
};

/**
 * One order, marketplace style: a header (number, date, store, status), the
 * items with thumbnails, then the total and whatever the customer can do next.
 * Product links go to the store the order was placed on (a customer with orders
 * on both stores sees both here), which is why they're built from the order's
 * own market rather than the visitor's.
 */
export async function OrderCard({ order, highlight, compact }: { order: OrderForCard; highlight?: boolean; compact?: boolean }) {
  const [t, tMarket, viewerMarket] = await Promise.all([getTranslations("orders"), getTranslations("market"), getMarket()]);
  const currency = order.currency === "LKR" ? "LKR" : "USD";
  // Product links go to the store the order was placed on (a customer with
  // orders on both stores sees both here); the "view details" link instead
  // follows whichever storefront the visitor is currently browsing — the
  // detail page itself isn't market-specific, so it should stay wherever
  // they already are rather than jumping them into the order's own store.
  const market = (order.market === "lk" ? "lk" : "intl") as Market;
  const detailHref = withMarket(`/account/orders/${order.id}`, viewerMarket);
  const shown = compact ? order.items.slice(0, 2) : order.items;

  return (
    <div
      id={order.orderNumber}
      className={cn(
        "scroll-mt-28 overflow-hidden rounded-xl border bg-surface",
        highlight ? "border-gold ring-2 ring-gold/30" : "border-border-subtle",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-subtle bg-ivory-soft px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <NextLink href={detailHref} className="font-mono text-sm text-charcoal underline-offset-2 hover:text-gold-deep hover:underline">
            {order.orderNumber}
          </NextLink>
          <p className="text-xs text-charcoal/60">{t("placed", { date: order.createdAt.toLocaleDateString() })}</p>
          <span className="rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[11px] text-charcoal/70">{tMarket(`name.${market}`)}</span>
        </div>
        <Badge className={STATUS_STYLES[order.status] ?? ""}>{t(`status.${order.status}`)}</Badge>
      </div>

      <div className="divide-y divide-border-subtle px-5">
        {shown.map((item) => {
          const product = item.gemstone ?? item.jewelry;
          const href = product ? withMarket(`/${item.gemstone ? "gems" : "jewelry"}/${product.slug}`, market) : null;
          const image = product?.media[0]?.url;
          const thumb = (
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ivory-soft">
              {image ? <Image src={image} alt="" fill sizes="56px" className="object-cover" /> : <Gem size={20} strokeWidth={1} className="text-charcoal/25" />}
            </span>
          );
          return (
            <div key={item.id} className="flex items-center gap-4 py-3">
              {href ? <NextLink href={href}>{thumb}</NextLink> : thumb}
              <div className="min-w-0 flex-1">
                {href ? (
                  <NextLink href={href} className="line-clamp-2 text-sm font-medium text-charcoal hover:text-gold-deep">{item.label}</NextLink>
                ) : (
                  <p className="line-clamp-2 text-sm font-medium text-charcoal">{item.label}</p>
                )}
                <p className="mt-0.5 text-xs text-charcoal/60">× {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm text-charcoal">{formatPrice(item.lineTotal, currency)}</p>
            </div>
          );
        })}
        {compact && order.items.length > shown.length && (
          <p className="py-2 text-xs text-charcoal/60">+ {order.items.length - shown.length} more</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-3">
        <p className="text-sm text-charcoal/70">
          {t("total")} <span className="ml-1 font-serif text-xl text-charcoal">{formatPrice(order.total, currency)}</span>
          {currency === "USD" && <span className="ml-1 text-xs text-charcoal/60">USD</span>}
        </p>
        <div className="flex items-center gap-3">
          <NextLink href={detailHref} className="text-xs text-gold-deep underline-offset-4 hover:underline">
            {t("viewDetails")} →
          </NextLink>
          {order.status === "PENDING_PAYMENT" && (
            <NextLink
              href={withMarket(order.paymentMethod === "WIRE_TRANSFER" ? `/checkout/wire?order=${order.id}` : `/checkout/return?order=${order.id}`, market)}
              className="rounded-full border border-gold bg-gold/10 px-4 py-1.5 text-xs font-medium text-charcoal transition-colors hover:bg-gold/25"
            >
              {order.paymentMethod === "WIRE_TRANSFER" ? t("paymentInstructions") : t("checkStatus")}
            </NextLink>
          )}
        </div>
      </div>
    </div>
  );
}
