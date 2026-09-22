"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import type { ActionResult } from "./auth";

// Approval gates nothing else in the app today beyond standing up the
// customer's team — a PENDING account can already browse, quote, and buy
// retail exactly like any other customer (see the comment on
// User.wholesaleStatus in schema.prisma). This is purely the admin review
// step for the business's own paper trail, plus creating the
// BusinessAccount that /account/business is built on, with the applicant
// as its OWNER (see lib/business.ts for how a member later joins it).
export async function approveWholesaleApplication(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.customerType !== "WHOLESALE") return { ok: false, error: "Wholesale application not found." };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { wholesaleStatus: "APPROVED" } });
    // A second approval click (or an application that was somehow
    // approved twice) shouldn't spawn a duplicate team — ownerId is
    // unique, so only create one if this user doesn't already own one.
    if (!user.businessAccountId) {
      const business = await tx.businessAccount.create({
        data: { name: user.businessName ?? user.name ?? "Wholesale Account", ownerId: userId },
      });
      await tx.user.update({ where: { id: userId }, data: { businessAccountId: business.id, businessRole: "OWNER" } });
    }
  });

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
