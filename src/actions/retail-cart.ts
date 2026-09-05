"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOrCreateRetailCart } from "@/lib/retail-cart";
import { normalizeCode, discountCodeError } from "@/lib/discount-codes";
import type { ActionResult } from "./auth";

export async function addToRetailCart(input: { gemstoneId?: string; jewelryId?: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };
  if (!input.gemstoneId && !input.jewelryId) return { ok: false, error: "No item specified." };

  const item = input.gemstoneId
    ? await prisma.gemstone.findUnique({ where: { id: input.gemstoneId } })
    : await prisma.jewelryPiece.findUnique({ where: { id: input.jewelryId } });
  if (!item || item.retailPrice == null) return { ok: false, error: "This item isn't available for direct purchase." };

  const cart = await getOrCreateRetailCart(session.user.id);
  if (input.gemstoneId) {
    await prisma.retailCartItem.upsert({
      where: { cartId_gemstoneId: { cartId: cart.id, gemstoneId: input.gemstoneId } },
      create: { cartId: cart.id, gemstoneId: input.gemstoneId, quantity: 1, unitPrice: item.retailPrice },
      update: { quantity: { increment: 1 }, unitPrice: item.retailPrice },
    });
  } else {
    await prisma.retailCartItem.upsert({
      where: { cartId_jewelryId: { cartId: cart.id, jewelryId: input.jewelryId! } },
      create: { cartId: cart.id, jewelryId: input.jewelryId, quantity: 1, unitPrice: item.retailPrice },
      update: { quantity: { increment: 1 }, unitPrice: item.retailPrice },
    });
  }

  revalidatePath("/account/retail-cart");
  return { ok: true };
}

export async function updateRetailCartItemQuantity(itemId: string, quantity: number): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };
  if (quantity < 1) return removeRetailCartItem(itemId);

  const item = await prisma.retailCartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== session.user.id) return { ok: false, error: "Item not found." };

  await prisma.retailCartItem.update({ where: { id: itemId }, data: { quantity } });
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

  const cart = await getOrCreateRetailCart(session.user.id);
  const cartWithItems = await prisma.retailCart.findUniqueOrThrow({ where: { id: cart.id }, include: { items: true } });
  if (cartWithItems.items.length === 0) return { ok: false, error: "Your cart is empty." };
  if (cart.discountCodeId) return { ok: false, error: "Remove the current code before applying a different one." };

  const discount = await prisma.discountCode.findUnique({ where: { code } });
  if (!discount) return { ok: false, error: "That code doesn't exist." };
  const error = discountCodeError(discount, session.user.id);
  if (error) return { ok: false, error };

  await prisma.retailCart.update({ where: { id: cart.id }, data: { discountCodeId: discount.id } });
  revalidatePath("/account/retail-cart");
  return { ok: true };
}

export async function removeRetailDiscountCode(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const cart = await getOrCreateRetailCart(session.user.id);
  if (!cart.discountCodeId) return { ok: false, error: "No code is applied." };

  await prisma.retailCart.update({ where: { id: cart.id }, data: { discountCodeId: null } });
  revalidatePath("/account/retail-cart");
  return { ok: true };
}
