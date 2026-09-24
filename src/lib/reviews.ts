import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// Same three "the order actually happened" statuses gem-dig/points-earning
// already gate on (see isGemDigEligible in lib/gem-dig.ts) — reviews are
// eligible from PAID onward rather than waiting for SHIPPED/DELIVERED,
// since delivery status isn't reliably tracked for every order today.
export const REVIEW_ELIGIBLE_STATUSES: ReadonlySet<OrderStatus> = new Set(["PAID", "SHIPPED", "DELIVERED"]);

export interface ReviewableItem {
  kind: "gemstone" | "jewelry";
  id: string;
  name: string;
  slug: string;
}

/** Every item on this order the customer bought but hasn't reviewed yet —
 * drives the "Leave a Review" prompts on the order detail page. Returns
 * nothing for an order that isn't eligible yet (see REVIEW_ELIGIBLE_STATUSES)
 * or doesn't belong to this user. */
export async function getReviewableItems(orderId: string, userId: string): Promise<ReviewableItem[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      status: true,
      items: {
        select: {
          gemstone: { select: { id: true, name: true, slug: true } },
          jewelry: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  if (!order || order.userId !== userId || !REVIEW_ELIGIBLE_STATUSES.has(order.status)) return [];

  const itemIds = order.items
    .map((i) => (i.gemstone ? { kind: "gemstone" as const, id: i.gemstone.id, name: i.gemstone.name, slug: i.gemstone.slug } : i.jewelry ? { kind: "jewelry" as const, id: i.jewelry.id, name: i.jewelry.name, slug: i.jewelry.slug } : null))
    .filter((i): i is ReviewableItem => i != null);
  if (itemIds.length === 0) return [];

  const existing = await prisma.review.findMany({
    where: {
      userId,
      OR: [
        { gemstoneId: { in: itemIds.filter((i) => i.kind === "gemstone").map((i) => i.id) } },
        { jewelryId: { in: itemIds.filter((i) => i.kind === "jewelry").map((i) => i.id) } },
      ],
    },
    select: { gemstoneId: true, jewelryId: true },
  });
  const reviewedIds = new Set(existing.map((r) => r.gemstoneId ?? r.jewelryId));

  // De-duplicated — an order can hold the same item more than once only in
  // theory (one-of-a-kind inventory), but this stays correct either way.
  const seen = new Set<string>();
  return itemIds.filter((i) => {
    if (reviewedIds.has(i.id) || seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

/** Creates a review — the purchase is re-verified live here (never trusted
 * from wherever the prompt was shown), same "hard recheck at the point of
 * action" discipline resolvePointsRedemption/finalizeDiscountRedemption
 * already follow elsewhere in this app. Starts PENDING; only ever shown
 * publicly once an admin approves it. */
export async function submitReview(input: { userId: string; gemstoneId?: string; jewelryId?: string; rating: number; body?: string }): Promise<SubmitReviewResult> {
  if (!input.gemstoneId && !input.jewelryId) return { ok: false, error: "No item specified." };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { ok: false, error: "Rating must be between 1 and 5." };

  const purchased = await prisma.orderItem.findFirst({
    where: {
      order: { userId: input.userId, status: { in: Array.from(REVIEW_ELIGIBLE_STATUSES) } },
      gemstoneId: input.gemstoneId,
      jewelryId: input.jewelryId,
    },
  });
  if (!purchased) return { ok: false, error: "You can only review items you've purchased." };

  try {
    await prisma.review.create({
      data: { userId: input.userId, gemstoneId: input.gemstoneId, jewelryId: input.jewelryId, rating: input.rating, body: input.body?.trim() || null },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "You've already reviewed this item." };
    }
    throw err;
  }
  return { ok: true };
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  reviews: { id: string; rating: number; body: string | null; reviewerName: string; createdAt: Date }[];
}

/** Approved reviews for one item, for its own product page — a rejected
 * or still-pending review never appears here. */
export async function getApprovedReviewsForItem(input: { gemstoneId?: string; jewelryId?: string }): Promise<ReviewSummary> {
  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED", gemstoneId: input.gemstoneId, jewelryId: input.jewelryId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  return {
    average,
    count: reviews.length,
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, body: r.body, reviewerName: r.user.name ?? "Verified Buyer", createdAt: r.createdAt })),
  };
}

/** Called from finalizePaidOrder once an order reaches PAID — notifies the
 * customer there's something to review, if the order actually has any
 * reviewable items (best-effort, never worth failing an already-successful
 * payment over, same convention as notifyGemDigAvailable). */
export async function notifyReviewPromptAvailable(order: { id: string; userId: string }): Promise<void> {
  const items = await getReviewableItems(order.id, order.userId);
  if (items.length === 0) return;

  await createNotification({
    userId: order.userId,
    type: "STATUS_CHANGE",
    message: "How was your purchase? Leave a review from your order.",
    requestType: "order",
    requestId: order.id,
  });
}
