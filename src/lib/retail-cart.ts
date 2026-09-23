import { prisma } from "@/lib/prisma";
import type { Market } from "@/lib/market-shared";

// One persistent retail cart per user (unlike the wholesale Cart, which
// cycles OPEN -> SUBMITTED and starts a fresh one each time) — a retail
// order completes synchronously via the PayHere redirect, so there's no
// "submitted, awaiting payment" state to model; the cart just empties out
// once payment succeeds (see app/api/payhere/notify/route.ts) and refills
// for the next purchase. Same self-provisioning pattern as
// lib/commerce-settings.ts's singleton.
//
// One cart per (user, market): the Sri Lanka store prices in rupees and the
// international site in dollars, so a single mixed cart would have no
// coherent total. Switching storefront switches carts.
export async function getOrCreateRetailCart(userId: string, market: Market = "intl") {
  const where = { userId_market: { userId, market } };
  const existing = await prisma.retailCart.findUnique({ where });
  if (existing) return existing;
  try {
    return await prisma.retailCart.create({ data: { userId, market } });
  } catch {
    return prisma.retailCart.findUniqueOrThrow({ where });
  }
}

export const retailCartItemInclude = {
  gemstone: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
  jewelry: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
  jewelryVariant: true,
} as const;

export async function getRetailCartWithItems(userId: string, market: Market = "intl") {
  const cart = await getOrCreateRetailCart(userId, market);
  return prisma.retailCart.findUniqueOrThrow({
    where: { id: cart.id },
    include: { items: { include: retailCartItemInclude }, discountCode: true },
  });
}

export function retailCartItemLabel(item: { gemstone: { name: string } | null; jewelry: { name: string } | null; jewelryVariant?: { label: string } | null }): string {
  const name = item.gemstone?.name ?? item.jewelry?.name ?? "Item";
  return item.jewelryVariant ? `${name} — ${item.jewelryVariant.label}` : name;
}

interface PricedProduct {
  retailPrice: number | null;
  lkrRetailPrice: number | null;
}

/** The line's current per-unit price for a market — the live retail price
 * (rupee column on /lk), preferring the selected variant's own override
 * when it has one, falling back to the price snapshotted when it was
 * added. Checkout re-reads live prices itself (buildCheckoutBreakdown). */
export function retailCartUnitPrice(
  item: { unitPrice: number; gemstone: PricedProduct | null; jewelry: PricedProduct | null; jewelryVariant?: PricedProduct | null },
  market: Market,
): number {
  const product = item.gemstone ?? item.jewelry;
  const variantLive = item.jewelryVariant ? (market === "lk" ? item.jewelryVariant.lkrRetailPrice : item.jewelryVariant.retailPrice) : null;
  const live = variantLive ?? (market === "lk" ? product?.lkrRetailPrice : product?.retailPrice);
  return live ?? item.unitPrice;
}

export function retailCartSubtotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}
