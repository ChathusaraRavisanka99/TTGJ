"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { ensureInvoiceForQuote } from "@/lib/invoicing";
import type { ActionResult } from "./auth";

const QUOTE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export async function updateQuoteRequest(
  id: string,
  status: QuoteStatus,
  adminNotes: string,
  // undefined = "leave as-is" (the price field was left blank because it
  // was already set); null = "explicitly clear it" — only reachable for
  // quoteValidUntil today, since the price field itself can't submit null.
  quotedPrice?: number,
  quoteValidUntil?: string | null,
): Promise<ActionResult> {
  await requireAdmin();
  if (!QUOTE_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const current = await prisma.quoteRequest.findUnique({ where: { id }, select: { quotedPrice: true } });
  if (!current) return { ok: false, error: "Quote not found." };

  // A price has to exist before a quote can be marked Quoted or Accepted —
  // otherwise there's nothing for the printable quote/invoice to show, and
  // an Accepted quote with no price would create a priceless invoice.
  const effectivePrice = quotedPrice ?? current.quotedPrice;
  if ((status === "QUOTED" || status === "ACCEPTED") && effectivePrice == null) {
    return { ok: false, error: "Set a price before marking this quote as Quoted or Accepted." };
  }

  await prisma.quoteRequest.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || undefined,
      quotedPrice: quotedPrice ?? undefined,
      quoteValidUntil: quoteValidUntil === undefined ? undefined : quoteValidUntil ? new Date(quoteValidUntil) : null,
      // Re-stamped any time a new price is submitted, including a revision
      // to an already-quoted request — this is "when was this last priced,"
      // not "when did it first become QUOTED."
      quotedAt: quotedPrice != null ? new Date() : undefined,
    },
  });

  if (status === "ACCEPTED") {
    await ensureInvoiceForQuote(id);
  }

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/account/quotes");
  return { ok: true };
}

export async function updateSourcingRequest(id: string, status: QuoteStatus, adminNotes: string): Promise<ActionResult> {
  await requireAdmin();
  if (!QUOTE_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  await prisma.sourcingRequest.update({
    where: { id },
    data: { status, adminNotes: adminNotes || undefined },
  });

  revalidatePath("/admin/sourcing");
  revalidatePath(`/admin/sourcing/${id}`);
  return { ok: true };
}
