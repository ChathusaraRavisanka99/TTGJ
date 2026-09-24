"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { parseStaffPermissions, STAFF_AREA_LABELS } from "@/lib/staff-permissions";
import { createStaffAccountSchema } from "@/lib/validation/auth";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { staffAccountCreatedEmail, staffAccessGrantedEmail } from "@/lib/email-templates";
import { withMarket } from "@/lib/market-shared";
import type { ActionResult } from "./auth";

const SCOPE_LABELS: Record<string, string> = { intl: "the International store", lk: "the Sri Lanka store", both: "both stores" };

function areasLabel(permissions: string[]): string {
  return parseStaffPermissions(permissions)
    .map((a) => STAFF_AREA_LABELS[a].label)
    .join(", ");
}

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
    permissions: parseStaffPermissions(formData.getAll("permissions")),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details you entered." };
  const { name, email, temporaryPassword, marketScope, permissions } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "STAFF", staffMarketScope: marketScope, staffPermissions: permissions, mustChangePassword: true },
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
    ...staffAccountCreatedEmail({ email, temporaryPassword, changePasswordUrl, marketScopeLabel: SCOPE_LABELS[marketScope] ?? marketScope, areasLabel: areasLabel(permissions) }),
  });
  if (!emailResult.ok) console.warn(`Staff account email not sent for ${email}: ${emailResult.error}`);

  revalidatePath("/admin/staff");
  return { ok: true };
}

// Finds existing (non-staff, non-admin) accounts an admin might want to
// make staff — by email or name, a handful at a time.
export async function searchUsersForStaff(query: string): Promise<{ id: string; name: string | null; email: string }[]> {
  await requireAdmin();
  const q = query.trim();
  if (q.length < 2) return [];
  return prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }],
    },
    select: { id: true, name: true, email: true },
    orderBy: { email: "asc" },
    take: 8,
  });
}

// Turns an existing customer account into a staff account, keeping their own
// password. Only ever CUSTOMER -> STAFF: an ADMIN is never touched here, and
// someone already staff is edited from their row instead.
export async function grantStaffAccess(userId: string, marketScope: string, permissions: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (marketScope !== "intl" && marketScope !== "lk" && marketScope !== "both") return { ok: false, error: "Choose which store(s) they can manage." };
  const areas = parseStaffPermissions(permissions);
  if (areas.length === 0) return { ok: false, error: "Switch on at least one area." };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!user) return { ok: false, error: "User not found." };
  if (user.role === "STAFF") return { ok: false, error: "This person is already staff — change their access from the list below." };
  if (user.role !== "CUSTOMER") return { ok: false, error: "This account can't be made staff." };

  await prisma.user.update({ where: { id: userId }, data: { role: "STAFF", staffMarketScope: marketScope, staffPermissions: areas } });

  await createNotification({
    userId,
    type: "STATUS_CHANGE",
    message: "You've been given staff access. Open the Admin Portal from your account menu.",
    requestType: "general",
    requestId: userId,
  });
  const adminUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/admin`;
  const emailResult = await sendEmail({
    to: user.email,
    ...staffAccessGrantedEmail({ marketScopeLabel: SCOPE_LABELS[marketScope], areasLabel: areasLabel(areas), adminUrl }),
  });
  if (!emailResult.ok) console.warn(`Staff access email not sent for ${user.email}: ${emailResult.error}`);

  revalidatePath("/admin/staff");
  revalidatePath("/admin/customers");
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

export async function updateStaffPermissions(userId: string, permissions: string[]): Promise<ActionResult> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "STAFF") return { ok: false, error: "Not a staff account." };

  // parseStaffPermissions drops anything that isn't a real area, so a
  // tampered request can't store an arbitrary value.
  await prisma.user.update({ where: { id: userId }, data: { staffPermissions: parseStaffPermissions(permissions) } });
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

  await prisma.user.update({ where: { id: userId }, data: { role: "CUSTOMER", staffMarketScope: null, staffPermissions: [] } });
  revalidatePath("/admin/staff");
  return { ok: true };
}
