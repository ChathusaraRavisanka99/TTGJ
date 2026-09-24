"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireStaffArea, requireMarketAccess } from "@/lib/rbac";
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

// A review belongs to a gem or jewelry piece, and so to that piece's store;
// STAFF may only moderate reviews of items in their own market scope.
async function requireReviewAccess(id: string) {
  const user = await requireStaffArea("reviews");
  const review = await prisma.review.findUnique({
    where: { id },
    select: { gemstone: { select: { market: true } }, jewelry: { select: { market: true } } },
  });
  if (!review) return { ok: false as const, error: "Review not found." };
  const market = review.gemstone?.market ?? review.jewelry?.market;
  if (!market) return { ok: false as const, error: "Review not found." };
  await requireMarketAccess(user, market);
  return { ok: true as const };
}

export async function approveReview(id: string): Promise<ActionResult> {
  const access = await requireReviewAccess(id);
  if (!access.ok) return access;
  const review = await prisma.review.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/admin/reviews");
  if (review.gemstoneId) revalidatePath("/gems", "layout");
  if (review.jewelryId) revalidatePath("/jewelry", "layout");
  return { ok: true };
}

export async function rejectReview(id: string, adminNotes: string): Promise<ActionResult> {
  const access = await requireReviewAccess(id);
  if (!access.ok) return access;
  await prisma.review.update({ where: { id }, data: { status: "REJECTED", adminNotes: adminNotes.trim() || null } });
  revalidatePath("/admin/reviews");
  return { ok: true };
}
