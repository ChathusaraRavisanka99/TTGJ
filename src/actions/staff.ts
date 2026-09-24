"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createStaffAccountSchema } from "@/lib/validation/auth";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { staffAccountCreatedEmail } from "@/lib/email-templates";
import { withMarket } from "@/lib/market-shared";
import type { ActionResult } from "./auth";

const SCOPE_LABELS: Record<string, string> = { intl: "International", lk: "Sri Lanka", both: "both stores'" };

// Admin-only — every action here manages who else gets into the back
// office at all, which is itself the thing "staff can't abuse the
// privileges" is protecting against. Same predefined-password pattern as
// createWholesaleAccount, adapted for a STAFF account: mustChangePassword
// true, a temporary password the admin sets and the new account is
// notified/emailed.
export async function createStaffAccount(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = createStaffAccountSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    temporaryPassword: String(formData.get("temporaryPassword") ?? ""),
    marketScope: formData.get("marketScope"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details you entered." };
  const { name, email, temporaryPassword, marketScope } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "STAFF", staffMarketScope: marketScope, mustChangePassword: true },
  });

  const changePasswordUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}${withMarket("/account/change-password", "intl")}`;
  await createNotification({
    userId: user.id,
    type: "STATUS_CHANGE",
    message: "Your staff account has been created — please change your temporary password from the account menu.",
    requestType: "general",
    requestId: user.id,
  });
  const emailResult = await sendEmail({
    to: email,
    ...staffAccountCreatedEmail({ email, temporaryPassword, changePasswordUrl, marketScopeLabel: SCOPE_LABELS[marketScope] ?? marketScope }),
  });
  if (!emailResult.ok) console.warn(`Staff account email not sent for ${email}: ${emailResult.error}`);

  revalidatePath("/admin/staff");
  return { ok: true };
}

export async function updateStaffMarketScope(userId: string, marketScope: "intl" | "lk" | "both"): Promise<ActionResult> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "STAFF") return { ok: false, error: "Not a staff account." };

  await prisma.user.update({ where: { id: userId }, data: { staffMarketScope: marketScope } });
  revalidatePath("/admin/staff");
  return { ok: true };
}

// Revokes back-office access entirely by demoting back to a normal
// customer account, rather than deleting it — their order-chat history
// (senderRole STAFF on past messages) and any paymentReversedBy audit
// trail stay intact either way, but this also means their existing
// session keeps working until it naturally expires (see the JWT/session
// comment in lib/auth.ts) rather than being force-revoked immediately.
export async function revokeStaffAccess(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "STAFF") return { ok: false, error: "Not a staff account." };

  await prisma.user.update({ where: { id: userId }, data: { role: "CUSTOMER", staffMarketScope: null } });
  revalidatePath("/admin/staff");
  return { ok: true };
}
