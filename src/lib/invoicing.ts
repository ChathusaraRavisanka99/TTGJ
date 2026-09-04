import { prisma } from "@/lib/prisma";
import { cartTotal } from "@/lib/discount-codes";

// Sequential per calendar year (INV-2026-0007, ...) rather than a global
// running count, so the numbering resets cleanly each year the way paper
// invoice books traditionally do. Based on a count of the year's existing
// invoices rather than a dedicated sequence table — this app has one admin
// at a time, so the (very small) race window on two simultaneous
// acceptances isn't worth a sequence table's extra moving part.
async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const count = await prisma.invoice.count({ where: { invoiceNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

/**
 * Called whenever a quote's status moves to ACCEPTED. Idempotent — if an
 * invoice already exists for this quote (status bounced back to ACCEPTED a
 * second time), it's left untouched rather than duplicated or overwritten;
 * an invoice is a historical snapshot, not something later edits reopen.
 * No-ops (does not throw) if the quote has no price set — the caller is
 * expected to have already validated that before allowing an ACCEPTED
 * transition in the first place.
 */
export async function ensureInvoiceForQuote(quoteId: string): Promise<void> {
  const existing = await prisma.invoice.findUnique({ where: { quoteRequestId: quoteId } });
  if (existing) return;

  const quote = await prisma.quoteRequest.findUnique({ where: { id: quoteId } });
  if (!quote || quote.quotedPrice == null) return;

  const invoiceNumber = await nextInvoiceNumber();
  await prisma.invoice.create({
    data: {
      invoiceNumber,
      quoteRequestId: quote.id,
      userId: quote.userId,
      amount: quote.quotedPrice,
    },
  });
}

// Distinct counter/prefix from nextInvoiceNumber above — a CartInvoice can
// cover several quotes/sourcing requests submitted together, the older
// per-quote Invoice never does, so "CART-2026-0003" vs "INV-2026-0003"
// keeps the two kinds of document visually unambiguous on paper.
async function nextCartInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CART-${year}-`;
  const count = await prisma.cartInvoice.count({ where: { invoiceNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

/**
 * Generates the one invoice a submitted cart can have, covering every item
 * in it at once — called by an admin action from the Submitted Carts view,
 * never automatically (unlike ensureInvoiceForQuote, which fires the
 * moment a quote is accepted). Idempotent: returns the existing invoice
 * rather than creating a second one if called again. Throws if the cart
 * isn't submitted yet or has no items — both should already be true by
 * the time an admin can reach this action.
 */
export async function ensureCartInvoice(cartId: string) {
  const existing = await prisma.cartInvoice.findUnique({ where: { cartId } });
  if (existing) return existing;

  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } });
  if (!cart) throw new Error("Cart not found.");
  if (cart.status !== "SUBMITTED") throw new Error("Only a submitted cart can be invoiced.");
  if (cart.items.length === 0) throw new Error("This cart has no items.");

  const amount = cartTotal(cart.items, cart.discountAmount);
  const invoiceNumber = await nextCartInvoiceNumber();
  return prisma.cartInvoice.create({
    data: { invoiceNumber, cartId: cart.id, userId: cart.userId, amount },
  });
}
