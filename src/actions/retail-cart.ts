"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOrCreateRetailCart } from "@/lib/retail-cart";
import { getMarket } from "@/lib/market";
import { normalizeCode, discountCodeError } from "@/lib/discount-codes";
import type { ActionResult } from "./auth";

export async function addToRetailCart(input: { gemstoneId?: string; jewelryId?: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };
  if (!input.gemstoneId && !input.jewelryId) return { ok: false, error: "No item specified." };

  const market = await getMarket();
  const item = input.gemstoneId
    ? await prisma.gemstone.findUnique({ where: { id: input.gemstoneId } })
    : await prisma.jewelryPiece.findUnique({ where: { id: input.jewelryId } });
  // The price the customer sees on their own storefront: rupees on /lk,
  // dollars everywhere else. A piece with no price for this market is
  // quote-only there.
  const unitPrice = market === "lk" ? item?.lkrRetailPrice : item?.retailPrice;
  // A listing from the other storefront can't be bought here (the catalogs
  // don't overlap), even if someone crafts the request by hand.
  if (!item || item.market !== market || unitPrice == null) return { ok: false, error: "This item isn't available for direct purchase." };
  // Every catalog item here is one-of-a-kind (natural gemstones, bespoke
  // jewelry) — there's no quantity/units field anywhere in the schema —
  // so once it's SOLD/RESERVED there's nothing left to add another unit
  // of. Re-checked again at checkout (see buildCheckoutBreakdown) for the
  // window between adding to cart and paying.
  if (item.stockStatus !== "AVAILABLE") return { ok: false, error: "This item is no longer available." };

  const cart = await getOrCreateRetailCart(session.user.id, market);
  if (input.gemstoneId) {
    await prisma.retailCartItem.upsert({
      where: { cartId_gemstoneId: { cartId: cart.id, gemstoneId: input.gemstoneId } },
      // Already in the cart (a repeat "Add to Cart" click) — one-of-a-kind,
      // so there's nothing to increment; just refresh the snapshotted price.
      create: { cartId: cart.id, gemstoneId: input.gemstoneId, quantity: 1, unitPrice },
      update: { quantity: 1, unitPrice },
    });
  } else {
    await prisma.retailCartItem.upsert({
      where: { cartId_jewelryId: { cartId: cart.id, jewelryId: input.jewelryId! } },
      create: { cartId: cart.id, jewelryId: input.jewelryId, quantity: 1, unitPrice },
      update: { quantity: 1, unitPrice },
    });
  }

  revalidatePath("/account/retail-cart");
  return { ok: true };
}

export async function removeRetailCartItem(itemId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const item = await prisma.retailCartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== session.user.id) return { ok: false, error: "Item not found." };

  await prisma.retailCartItem.delete({ where: { id: itemId } });
  revalidatePath("/account/retail-cart");
  return { ok: true };
}

// ---------- Discount code on the retail cart ----------
//
// Same "apply only previews, finalize is what actually redeems" split as
// the wholesale Cart's applyDiscountCode/removeDiscountCode — see
// lib/discount-codes.ts. Finalization happens in actions/checkout.ts once
// PayHere confirms payment, not here.

export async function applyRetailDiscountCode(rawCode: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: "Enter a code." };

  const market = await getMarket();
  const cart = await getOrCreateRetailCart(session.user.id, market);
  const cartWithItems = await prisma.retailCart.findUniqueOrThrow({ where: { id: cart.id }, include: { items: true } });
  if (cartWithItems.items.length === 0) return { ok: false, error: "Your cart is empty." };
  if (cart.discountCodeId) return { ok: false, error: "Remove the current code before applying a different one." };

  const discount = await prisma.discountCode.findUnique({ where: { code } });
  if (!discount) return { ok: false, error: "That code doesn't exist." };
  const error = discountCodeError(discount, session.user.id);
  if (error) return { ok: false, error };
  // amountOff is dollars; a code only works on the Sri Lanka store once an
  // admin has given it a rupee value.
  if (market === "lk" && discount.amountOffLkr == null) return { ok: false, error: "This code isn't valid on the Sri Lanka store." };

  await prisma.retailCart.update({ where: { id: cart.id }, data: { discountCodeId: discount.id } });
  revalidatePath("/account/retail-cart");
  return { ok: true };
}

export async function removeRetailDiscountCode(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const cart = await getOrCreateRetailCart(session.user.id, await getMarket());
  if (!cart.discountCodeId) return { ok: false, error: "No code is applied." };

  await prisma.retailCart.update({ where: { id: cart.id }, data: { discountCodeId: null } });
  revalidatePath("/account/retail-cart");
  return { ok: true };
}
