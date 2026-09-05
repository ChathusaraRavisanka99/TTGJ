import { prisma } from "@/lib/prisma";

// One persistent retail cart per user (unlike the wholesale Cart, which
// cycles OPEN -> SUBMITTED and starts a fresh one each time) — a retail
// order completes synchronously via the PayHere redirect, so there's no
// "submitted, awaiting payment" state to model; the cart just empties out
// once payment succeeds (see app/api/payhere/notify/route.ts) and refills
// for the next purchase. Same self-provisioning pattern as
// lib/commerce-settings.ts's singleton.
export async function getOrCreateRetailCart(userId: string) {
  const existing = await prisma.retailCart.findUnique({ where: { userId } });
  if (existing) return existing;
  try {
    return await prisma.retailCart.create({ data: { userId } });
  } catch {
    return prisma.retailCart.findUniqueOrThrow({ where: { userId } });
  }
}

export const retailCartItemInclude = {
  gemstone: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
  jewelry: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
} as const;

export async function getRetailCartWithItems(userId: string) {
  const cart = await getOrCreateRetailCart(userId);
  return prisma.retailCart.findUniqueOrThrow({
    where: { id: cart.id },
    include: { items: { include: retailCartItemInclude }, discountCode: true },
  });
}

export function retailCartItemLabel(item: { gemstone: { name: string } | null; jewelry: { name: string } | null }): string {
  return item.gemstone?.name ?? item.jewelry?.name ?? "Item";
}

export function retailCartSubtotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}
