"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { ensureInvoiceForQuote } from "@/lib/invoicing";
import { ensureOrderForQuote, ensureOrderForSourcing } from "@/lib/orders";
import { createNotification } from "@/lib/notifications";
import type { ActionResult } from "./auth";

const QUOTE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
type QuoteStatus = (typeof QUOTE_STATUSES)[number];

const STATUS_LABELS: Record<QuoteStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

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
  const admin = await requireAdmin();
  if (!QUOTE_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const current = await prisma.quoteRequest.findUnique({ where: { id }, select: { quotedPrice: true, status: true, userId: true } });
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
    const orderResult = await ensureOrderForQuote(id, admin.id);
    if (!orderResult.ok) {
      // The order (and the reservation it needs) couldn't be created —
      // leave everything else (price, notes) saved, but don't leave this
      // quote sitting in ACCEPTED with no order behind it.
      await prisma.quoteRequest.update({ where: { id }, data: { status: current.status } });
      return orderResult;
    }
  }

  // Only a genuine transition notifies — re-saving the same status (e.g.
  // just editing adminNotes) would otherwise spam a fresh notification
  // every time.
  if (status !== current.status) {
    await createNotification({
      userId: current.userId,
      type: "STATUS_CHANGE",
      message: `Your quote request is now ${STATUS_LABELS[status]}.`,
      requestType: "quote",
      requestId: id,
    });
  }

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/account/quotes");
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function updateSourcingRequest(
  id: string,
  status: QuoteStatus,
  adminNotes: string,
  // Same "leave as-is" / "explicitly clear it" convention as
  // updateQuoteRequest's own quotedPrice/quoteValidUntil params.
  quotedPrice?: number,
  quoteValidUntil?: string | null,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!QUOTE_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const current = await prisma.sourcingRequest.findUnique({ where: { id }, select: { quotedPrice: true, status: true, userId: true } });
  if (!current) return { ok: false, error: "Sourcing request not found." };

  const effectivePrice = quotedPrice ?? current.quotedPrice;
  if ((status === "QUOTED" || status === "ACCEPTED") && effectivePrice == null) {
    return { ok: false, error: "Set a price before marking this request as Quoted or Accepted." };
  }

  await prisma.sourcingRequest.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || undefined,
      quotedPrice: quotedPrice ?? undefined,
      quoteValidUntil: quoteValidUntil === undefined ? undefined : quoteValidUntil ? new Date(quoteValidUntil) : null,
      quotedAt: quotedPrice != null ? new Date() : undefined,
    },
  });

  if (status === "ACCEPTED") {
    const orderResult = await ensureOrderForSourcing(id, admin.id);
    if (!orderResult.ok) {
      await prisma.sourcingRequest.update({ where: { id }, data: { status: current.status } });
      return orderResult;
    }
  }

  if (status !== current.status) {
    await createNotification({
      userId: current.userId,
      type: "STATUS_CHANGE",
      message: `Your sourcing request is now ${STATUS_LABELS[status]}.`,
      requestType: "sourcing",
      requestId: id,
    });
  }

  revalidatePath("/admin/sourcing");
  revalidatePath(`/admin/sourcing/${id}`);
  revalidatePath("/account/sourcing");
  revalidatePath("/admin/orders");
  return { ok: true };
}
