import { prisma } from "@/lib/prisma";

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
