// Auction timing/eligibility is entirely computed here, never stored or
// cron'd — see the schema comment above the Auction model. `status` on
// the row only tracks the admin-driven transitions (Draft -> Active, or
// Cancelled/Won); everything about whether bidding is currently open,
// closed and awaiting confirmation, or closed with no winner is derived
// from startsAt/endsAt/reservePrice/bids at read time by the functions
// below, so nothing needs to run on a schedule to "close" an auction.

export type AuctionDisplayState =
  | "DRAFT"
  | "SCHEDULED"
  | "OPEN"
  | "RESERVE_NOT_MET"
  | "AWAITING_CONFIRMATION"
  | "WON"
  | "CANCELLED";

interface AuctionForState {
  status: "DRAFT" | "ACTIVE" | "CANCELLED" | "WON";
  startsAt: Date;
  endsAt: Date;
  reservePrice: number;
  bids: { amount: number }[];
}

export function highestBid(bids: { amount: number }[]): number | null {
  if (bids.length === 0) return null;
  return Math.max(...bids.map((b) => b.amount));
}

/**
 * The single source of truth for "what state is this auction actually
 * in right now" — every page (public list/detail, admin list/detail)
 * calls this rather than re-deriving it inline, so the rules can't drift
 * between them.
 */
export function getAuctionDisplayState(auction: AuctionForState, now: Date = new Date()): AuctionDisplayState {
  if (auction.status === "CANCELLED") return "CANCELLED";
  if (auction.status === "WON") return "WON";
  if (auction.status === "DRAFT") return "DRAFT";

  // status === "ACTIVE" from here — an admin has switched this auction on,
  // but whether it's actually taking bids right now depends on the clock.
  if (now < auction.startsAt) return "SCHEDULED";
  if (now <= auction.endsAt) return "OPEN";

  const top = highestBid(auction.bids);
  return top != null && top >= auction.reservePrice ? "AWAITING_CONFIRMATION" : "RESERVE_NOT_MET";
}

export const AUCTION_STATE_LABELS: Record<AuctionDisplayState, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Starts Soon",
  OPEN: "Open for Bidding",
  RESERVE_NOT_MET: "Closed — Reserve Not Met",
  AWAITING_CONFIRMATION: "Closed — Awaiting Confirmation",
  WON: "Won",
  CANCELLED: "Cancelled",
};

// Customer-facing wording is deliberately vaguer than the admin's — a
// bidder never needs to know "AWAITING_CONFIRMATION" is a distinct state
// from "reserve not met," both just read as "closed" until an admin
// actually confirms a winner (at which point WON kicks in and, for the
// winner specifically, the item shows up in their cart).
export const PUBLIC_AUCTION_STATE_LABELS: Record<AuctionDisplayState, string> = {
  DRAFT: "Not yet open",
  SCHEDULED: "Starting soon",
  OPEN: "Bidding open",
  RESERVE_NOT_MET: "Closed",
  AWAITING_CONFIRMATION: "Closed",
  WON: "Sold",
  CANCELLED: "Cancelled",
};

/** The minimum a new bid has to be to be accepted right now. */
export function minimumNextBid(auction: { startingPrice: number; bidIncrement: number }, bids: { amount: number }[]): number {
  const top = highestBid(bids);
  return top == null ? auction.startingPrice : top + auction.bidIncrement;
}

export function auctionItemLabel(auction: { gemstone: { name: string } | null; jewelry: { name: string } | null }): string {
  return auction.gemstone?.name ?? auction.jewelry?.name ?? "Auction item";
}
