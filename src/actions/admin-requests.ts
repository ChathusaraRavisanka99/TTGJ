"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import type { ActionResult } from "./auth";

const QUOTE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export async function updateQuoteRequest(id: string, status: QuoteStatus, adminNotes: string): Promise<ActionResult> {
  await requireAdmin();
  if (!QUOTE_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  await prisma.quoteRequest.update({
    where: { id },
    data: { status, adminNotes: adminNotes || undefined },
  });

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
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
