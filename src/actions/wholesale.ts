"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import type { ActionResult } from "./auth";

// Approval gates nothing else in the app today — a PENDING account can
// already browse, quote, and buy retail exactly like any other customer
// (see the comment on User.wholesaleStatus in schema.prisma). This is
// purely the admin review step for the business's own paper trail.
export async function approveWholesaleApplication(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.customerType !== "WHOLESALE") return { ok: false, error: "Wholesale application not found." };

  await prisma.user.update({ where: { id: userId }, data: { wholesaleStatus: "APPROVED" } });
  revalidatePath("/admin/wholesale-applications");
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true };
}

export async function rejectWholesaleApplication(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.customerType !== "WHOLESALE") return { ok: false, error: "Wholesale application not found." };

  await prisma.user.update({ where: { id: userId }, data: { wholesaleStatus: "REJECTED" } });
  revalidatePath("/admin/wholesale-applications");
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true };
}
