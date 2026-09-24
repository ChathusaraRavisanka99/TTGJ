import { prisma } from "@/lib/prisma";
import { getLoyaltySettings } from "@/lib/loyalty-settings";
import { recordPointsTransaction } from "@/lib/rewards";
import { createNotification } from "@/lib/notifications";

// The bonus is a random point somewhere in this range of the order's own
// profit margin — "dig" for it rather than always getting the same
// amount. Deliberately modest (an occasional delight, not a meaningful
// discount mechanism) and funded only by real profit, never revenue.
const MIN_BONUS_PERCENT = 1;
const MAX_BONUS_PERCENT = 5;

const DIG_ELIGIBLE_STATUSES = new Set(["PAID", "SHIPPED", "DELIVERED"]);

interface GemDigItem {
  quantity: number;
  lineTotal: number;
  gemstone: { costPrice: number | null } | null;
  jewelry: { costPrice: number | null } | null;
  jewelryVariant: { costPrice: number | null } | null;
}

export interface GemDigOrder {
  id: string;
  userId: string;
  status: string;
  currency: string;
  gemDigPlayedAt: Date | null;
  gemDigPointsAwarded: number | null;
  items: GemDigItem[];
}

/** Same per-item cost fallback chain checkout's own money math uses
 * (variant override, else the piece's own costPrice) — an item with
 * neither recorded contributes nothing, same as computeProfit's own
 * "never guess at cost" rule. */
function orderProfit(order: { items: GemDigItem[] }): number {
  let profit = 0;
  for (const item of order.items) {
    const unitCost = item.jewelryVariant?.costPrice ?? item.gemstone?.costPrice ?? item.jewelry?.costPrice ?? null;
    if (unitCost == null) continue;
    profit += Math.max(0, item.lineTotal - unitCost * item.quantity);
  }
  return profit;
}

export function isGemDigEligible(order: GemDigOrder): boolean {
  if (!DIG_ELIGIBLE_STATUSES.has(order.status)) return false;
  if (order.gemDigPlayedAt) return false;
  return orderProfit(order) > 0;
}

async function pointsRate(currency: string): Promise<number> {
  const loyalty = await getLoyaltySettings();
  return currency === "LKR" ? loyalty.pointsPerCurrencyUnitLkr : loyalty.pointsPerCurrencyUnit;
}

/** The range shown before digging — computed fresh each time (not
 * persisted), since the profit it's based on has already happened and
 * isn't expected to change under an eligible order. */
export async function gemDigPointsRange(order: GemDigOrder): Promise<{ min: number; max: number }> {
  const rate = await pointsRate(order.currency);
  const profit = orderProfit(order);
  return {
    min: Math.max(1, Math.floor(profit * (MIN_BONUS_PERCENT / 100) * rate)),
    max: Math.max(1, Math.floor(profit * (MAX_BONUS_PERCENT / 100) * rate)),
  };
}

export type PlayGemDigResult = { ok: true; points: number } | { ok: false; error: string };

/** Rolls the actual bonus and claims it — a conditional update
 * (gemDigPlayedAt: null -> now) inside the same transaction as the
 * points transaction it creates, so a double-click or a race against
 * itself can't award the bonus twice. */
export async function playGemDig(orderId: string, userId: string): Promise<PlayGemDigResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        select: {
          quantity: true,
          lineTotal: true,
          gemstone: { select: { costPrice: true } },
          jewelry: { select: { costPrice: true } },
          jewelryVariant: { select: { costPrice: true } },
        },
      },
    },
  });
  if (!order || order.userId !== userId) return { ok: false, error: "Order not found." };
  if (!isGemDigEligible(order)) return { ok: false, error: "There's no reward to dig for on this order." };

  const rate = await pointsRate(order.currency);
  const profit = orderProfit(order);
  const percent = MIN_BONUS_PERCENT + Math.random() * (MAX_BONUS_PERCENT - MIN_BONUS_PERCENT);
  const points = Math.max(1, Math.floor(profit * (percent / 100) * rate));

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, gemDigPlayedAt: null },
        data: { gemDigPlayedAt: new Date(), gemDigPointsAwarded: points },
      });
      if (claimed.count === 0) throw new Error("ALREADY_CLAIMED");
      await recordPointsTransaction(tx, { userId, amount: points, reason: "GEM_DIG_BONUS", orderId });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_CLAIMED") {
      return { ok: false, error: "This reward has already been claimed." };
    }
    throw err;
  }

  return { ok: true, points };
}

/** Called from finalizePaidOrder once an order reaches PAID — notifies
 * the customer there's a reward waiting, if the order actually has one
 * (a zero/uncosted-profit order has nothing to dig for, so it's silently
 * skipped rather than offering a hollow "dig for 0 points"). Points at
 * the order page itself (the existing "order" notification target —
 * see NotificationBell's requestHref) rather than a dedicated
 * notification link straight to /dig, so the CTA to actually play stays
 * visible on the order page too, not just reachable through a
 * notification that might get missed or dismissed. Best-effort like
 * every other post-payment notification: never worth failing an
 * already-successful payment over. */
export async function notifyGemDigAvailable(order: { id: string; userId: string }): Promise<void> {
  const full = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: {
        select: {
          quantity: true,
          lineTotal: true,
          gemstone: { select: { costPrice: true } },
          jewelry: { select: { costPrice: true } },
          jewelryVariant: { select: { costPrice: true } },
        },
      },
    },
  });
  if (!full || !isGemDigEligible(full)) return;

  await createNotification({
    userId: order.userId,
    type: "STATUS_CHANGE",
    message: "You've earned a chance to dig for a bonus gem — open your order to give it a try.",
    requestType: "order",
    requestId: order.id,
  });
}
