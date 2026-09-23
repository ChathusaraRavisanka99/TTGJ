"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { requestRefund, resolveRefundRequest, denyRefundRequest } from "@/lib/refunds";
import { refundRequestSchema, resolveRefundSchema } from "@/lib/validation/refunds";
import type { ActionResult } from "./auth";

export async function requestRefundAction(orderId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const parsed = refundRequestSchema.safeParse({
    reason: formData.get("reason"),
    reasonNotes: formData.get("reasonNotes") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const result = await requestRefund(orderId, session.user.id, parsed.data);
  if (!result.ok) return result;

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function resolveRefundRequestAction(id: string, orderId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  // Object.fromEntries (not formData.get) for "restock": it's a checkbox
  // paired with a hidden "false" fallback (same pattern as isPublished
  // etc. elsewhere in this app) — a checked box submits both values, and
  // only Object.fromEntries keeps the checkbox's later "true" over the
  // hidden field's earlier "false"; formData.get would return the first.
  const parsed = resolveRefundSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const result = await resolveRefundRequest(id, {
    resolution: parsed.data.resolution,
    customAmount: parsed.data.customAmount,
    restock: parsed.data.restock,
    adminNotes: parsed.data.adminNotes,
  });
  if (!result.ok) return result;

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}

export async function denyRefundRequestAction(id: string, orderId: string, adminNotes: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await denyRefundRequest(id, adminNotes);
  if (!result.ok) return result;

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}
