import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { confirmAuctionWinner } from "@/actions/auctions";
import { ensureOrderForAuctionWin } from "@/lib/orders";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/orders", () => ({ ensureOrderForAuctionWin: vi.fn() }));

const closedAwaitingConfirmation = {
  id: "auction-1",
  status: "ACTIVE",
  startsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  endsAt: new Date(Date.now() - 60 * 60 * 1000),
  reservePrice: 1000,
  bids: [{ amount: 1200 }],
};

describe("confirmAuctionWinner", () => {
  it("refuses when the auction doesn't exist", async () => {
    prismaMock.auction.findUnique.mockResolvedValue(null);
    const result = await confirmAuctionWinner("auction-1");
    expect(result).toEqual({ ok: false, error: "Auction not found." });
    expect(ensureOrderForAuctionWin).not.toHaveBeenCalled();
  });

  it("refuses an auction that isn't closed with a reserve-meeting bid", async () => {
    prismaMock.auction.findUnique.mockResolvedValue({ ...closedAwaitingConfirmation, bids: [{ amount: 500 }] } as never); // below reserve
    const result = await confirmAuctionWinner("auction-1");
    expect(result.ok).toBe(false);
    expect(prismaMock.auction.update).not.toHaveBeenCalled();
  });

  it("marks the auction WON with a wonAt timestamp and creates the winner's order", async () => {
    prismaMock.auction.findUnique.mockResolvedValue(closedAwaitingConfirmation as never);
    prismaMock.auction.update.mockResolvedValue({} as never);
    vi.mocked(ensureOrderForAuctionWin).mockResolvedValue({ ok: true, orderId: "order-1" });

    const result = await confirmAuctionWinner("auction-1");

    expect(result).toEqual({ ok: true });
    expect(prismaMock.auction.update).toHaveBeenCalledWith({ where: { id: "auction-1" }, data: { status: "WON", wonAt: expect.any(Date) } });
    expect(ensureOrderForAuctionWin).toHaveBeenCalledWith("auction-1");
  });

  it("reverts the auction back to its prior status if the item couldn't actually be reserved", async () => {
    prismaMock.auction.findUnique.mockResolvedValue(closedAwaitingConfirmation as never);
    prismaMock.auction.update.mockResolvedValue({} as never);
    vi.mocked(ensureOrderForAuctionWin).mockResolvedValue({ ok: false, error: "That item is no longer available to sell — it may have already been sold or reserved elsewhere." });

    const result = await confirmAuctionWinner("auction-1");

    expect(result).toEqual({ ok: false, error: "That item is no longer available to sell — it may have already been sold or reserved elsewhere." });
    expect(prismaMock.auction.update).toHaveBeenCalledWith({ where: { id: "auction-1" }, data: { status: "ACTIVE", wonAt: null } });
  });
});
