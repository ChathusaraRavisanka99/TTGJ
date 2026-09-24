"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { submitReview } from "@/lib/reviews";
import type { ActionResult } from "./auth";

export async function submitReviewAction(input: { gemstoneId?: string; jewelryId?: string }, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "");

  const result = await submitReview({ userId: session.user.id, gemstoneId: input.gemstoneId, jewelryId: input.jewelryId, rating, body });
  if (!result.ok) return result;

  revalidatePath("/account/orders");
  if (input.gemstoneId) revalidatePath("/gems", "layout");
  if (input.jewelryId) revalidatePath("/jewelry", "layout");
  return { ok: true };
}

export async function approveReview(id: string): Promise<ActionResult> {
  await requireAdmin();
  const review = await prisma.review.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/admin/reviews");
  if (review.gemstoneId) revalidatePath("/gems", "layout");
  if (review.jewelryId) revalidatePath("/jewelry", "layout");
  return { ok: true };
}

export async function rejectReview(id: string, adminNotes: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.review.update({ where: { id }, data: { status: "REJECTED", adminNotes: adminNotes.trim() || null } });
  revalidatePath("/admin/reviews");
  return { ok: true };
}
