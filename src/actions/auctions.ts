"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { ensureCartItemForAuction } from "@/lib/cart";
import { getAuctionDisplayState, minimumNextBid } from "@/lib/auctions";
import { getPageVisibility } from "@/lib/page-visibility";
import type { ActionResult } from "./auth";

interface AuctionInput {
  gemstoneId: string | null;
  jewelryId: string | null;
  startingPrice: number;
  reservePrice: number;
  bidIncrement: number;
  // datetime-local input values ("yyyy-MM-ddTHH:mm"), parsed with `new Date`.
  startsAt: string;
  endsAt: string;
  status: "DRAFT" | "ACTIVE";
}

function validateAuctionInput(input: Omit<AuctionInput, "status">): string | null {
  if (!input.gemstoneId && !input.jewelryId) return "Pick a gemstone or jewelry piece to auction.";
  if (input.gemstoneId && input.jewelryId) return "Pick only one item — a gemstone or a jewelry piece, not both.";
  if (!Number.isFinite(input.startingPrice) || input.startingPrice <= 0) return "Enter a starting price greater than $0.";
  if (!Number.isFinite(input.reservePrice) || input.reservePrice < input.startingPrice) {
    return "The reserve price must be at least the starting price.";
  }
  if (!Number.isFinite(input.bidIncrement) || input.bidIncrement <= 0) return "Enter a bid increment greater than $0.";
  const starts = new Date(input.startsAt);
  const ends = new Date(input.endsAt);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) return "Enter valid start and end times.";
  if (ends <= starts) return "The end time must be after the start time.";
  return null;
}

export async function createAuction(input: AuctionInput): Promise<ActionResult> {
  await requireAdmin();
  const error = validateAuctionInput(input);
  if (error) return { ok: false, error };

  await prisma.auction.create({
    data: {
      gemstoneId: input.gemstoneId,
      jewelryId: input.jewelryId,
      startingPrice: input.startingPrice,
      reservePrice: input.reservePrice,
      bidIncrement: input.bidIncrement,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      status: input.status,
    },
  });

  revalidatePath("/admin/auctions");
  revalidatePath("/auction");
  return { ok: true };
}

// Bids already placed lock the item choice — editing a running/closed
// auction's schedule and prices is still allowed (correcting a typo'd
// reserve, extending an end time), but not which product it's for.
export async function updateAuction(
  id: string,
  input: Omit<AuctionInput, "gemstoneId" | "jewelryId" | "status"> & { status: "DRAFT" | "ACTIVE" | "CANCELLED" },
): Promise<ActionResult> {
  await requireAdmin();
  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) return { ok: false, error: "Auction not found." };
  if (auction.status === "WON") return { ok: false, error: "A won auction can't be edited." };

  const error = validateAuctionInput({ ...input, gemstoneId: auction.gemstoneId, jewelryId: auction.jewelryId });
  if (error) return { ok: false, error };

  await prisma.auction.update({
    where: { id },
    data: {
      startingPrice: input.startingPrice,
      reservePrice: input.reservePrice,
      bidIncrement: input.bidIncrement,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      status: input.status,
    },
  });

  revalidatePath("/admin/auctions");
  revalidatePath(`/admin/auctions/${id}`);
  revalidatePath("/auction");
  revalidatePath(`/auction/${id}`);
  return { ok: true };
}

// Only reachable while still Draft and bid-free — once bidding has
// opened or a bid exists, cancel (below) is the way to pull it, so
// there's always a record of what happened rather than it vanishing.
export async function deleteAuction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const auction = await prisma.auction.findUnique({ where: { id }, include: { _count: { select: { bids: true } } } });
  if (!auction) return { ok: false, error: "Auction not found." };
  if (auction.status !== "DRAFT" || auction._count.bids > 0) {
    return { ok: false, error: "Only a draft auction with no bids can be deleted — cancel it instead." };
  }

  await prisma.auction.delete({ where: { id } });
  revalidatePath("/admin/auctions");
  return { ok: true };
}

export async function cancelAuction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) return { ok: false, error: "Auction not found." };
  if (auction.status === "WON") return { ok: false, error: "A won auction can't be cancelled." };

  await prisma.auction.update({ where: { id }, data: { status: "CANCELLED" } });

  revalidatePath("/admin/auctions");
  revalidatePath(`/admin/auctions/${id}`);
  revalidatePath("/auction");
  return { ok: true };
}

/**
 * Bidding is provisional by design (see the schema comment on Auction) —
 * the highest bidder when an auction closes past its reserve doesn't
 * automatically win anything until an admin reviews the bid history here
 * and confirms. Confirming drops a CartItem into the winner's open cart
 * (see ensureCartItemForAuction), from which the existing cart/wire-
 * transfer/invoice flow takes over unchanged.
 */
export async function confirmAuctionWinner(id: string): Promise<ActionResult> {
  await requireAdmin();
  const auction = await prisma.auction.findUnique({ where: { id }, include: { bids: true } });
  if (!auction) return { ok: false, error: "Auction not found." };

  const state = getAuctionDisplayState(auction);
  if (state !== "AWAITING_CONFIRMATION") {
    return { ok: false, error: "This auction isn't closed with a reserve-meeting bid to confirm." };
  }

  await prisma.auction.update({ where: { id }, data: { status: "WON" } });
  await ensureCartItemForAuction(id);

  revalidatePath("/admin/auctions");
  revalidatePath(`/admin/auctions/${id}`);
  revalidatePath("/admin/carts");
  revalidatePath("/account/cart");
  revalidatePath("/auction");
  return { ok: true };
}

// ---------- Customer: bidding ----------

export async function placeBid(auctionId: string, amount: number): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in to bid." };
  if (!Number.isFinite(amount)) return { ok: false, error: "Enter a bid amount." };

  // The public /auction page itself already refuses to render a bid form
  // unless this is Live, but that's a UI-layer check only — this action
  // is reachable directly with nothing but an auction's id, which isn't a
  // secret (it's in the page URL once an admin shares one). Hidden or
  // Coming Soon means the feature isn't meant to be live yet at all, so
  // that has to be enforced here too, not just by what the page renders.
  const visibility = await getPageVisibility("auction");
  if (visibility !== "LIVE") return { ok: false, error: "Auctions aren't open right now." };

  const auction = await prisma.auction.findUnique({ where: { id: auctionId }, include: { bids: true } });
  if (!auction) return { ok: false, error: "Auction not found." };

  const state = getAuctionDisplayState(auction);
  if (state !== "OPEN") return { ok: false, error: "This auction isn't open for bidding right now." };

  const minimum = minimumNextBid(auction, auction.bids);
  if (amount < minimum) return { ok: false, error: `Bid at least $${minimum.toLocaleString()}.` };

  await prisma.auctionBid.create({ data: { auctionId, userId: session.user.id, amount } });

  revalidatePath(`/auction/${auctionId}`);
  return { ok: true };
}
