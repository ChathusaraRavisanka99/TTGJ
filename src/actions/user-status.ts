"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import type { ActionResult } from "./auth";

export type DisableInput =
  | { mode: "enable" }
  | { mode: "permanent"; reason?: string }
  | { mode: "temporary"; until: string; reason?: string };

// Switches an account off (temporarily until a date, or permanently) or back
// on. Admin-only. An ADMIN account can never be disabled here — that would be
// a way to lock the whole back office out — and nobody can disable themselves.
//
// Disabling blocks sign-in and, for staff, removes every back-office right on
// their very next request. Their sessions can't be revoked from the server
// (the token lives in their browser), so beyond that the account is refused
// wherever a server action re-checks it (see requireUser) and in the account
// area itself.
export async function setUserDisabled(userId: string, input: DisableInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) return { ok: false, error: "You can't disable your own account." };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { ok: false, error: "User not found." };
  if (target.role === "ADMIN") return { ok: false, error: "An admin account can't be disabled." };

  if (input.mode === "enable") {
    await prisma.user.update({ where: { id: userId }, data: { disabledAt: null, disabledUntil: null, disabledReason: null } });
  } else {
    const reason = (input.reason ?? "").trim().slice(0, 500) || null;
    let until: Date | null = null;
    if (input.mode === "temporary") {
      until = new Date(input.until);
      if (Number.isNaN(until.getTime()) || until <= new Date()) return { ok: false, error: "Choose a date in the future." };
    }
    await prisma.user.update({ where: { id: userId }, data: { disabledAt: new Date(), disabledUntil: until, disabledReason: reason } });
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true };
}
