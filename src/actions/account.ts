"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validation/auth";
import type { ActionResult } from "./auth";

/**
 * A signed-in customer changing their own password — requires the
 * current one first (proves the request came from someone who actually
 * knows it, not just a hijacked session), unlike the forgot-password flow
 * which proves ownership via an emailed token instead. Also clears
 * mustChangePassword, if it was set (see createWholesaleAccount).
 */
export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details you entered." };
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  // No passwordHash: a Google-only account has nothing to change here.
  if (!user?.passwordHash) return { ok: false, error: "This account doesn't have a password to change." };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { ok: false, error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash, mustChangePassword: false } });

  revalidatePath("/account");
  return { ok: true };
}
