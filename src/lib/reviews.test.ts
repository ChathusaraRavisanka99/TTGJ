import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { prismaMock } from "@/test/prisma-mock";
import { getReviewableItems, submitReview, getApprovedReviewsForItem, notifyReviewPromptAvailable } from "@/lib/reviews";
import { createNotification } from "@/lib/notifications";

vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getReviewableItems", () => {
  it("returns nothing for an order that isn't eligible yet", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ userId: "user-1", status: "PENDING_PAYMENT", items: [] } as never);
    const result = await getReviewableItems("order-1", "user-1");
    expect(result).toEqual([]);
  });

  it("returns nothing for an order belonging to someone else", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ userId: "someone-else", status: "PAID", items: [] } as never);
    const result = await getReviewableItems("order-1", "user-1");
    expect(result).toEqual([]);
  });

  it("lists purchased items not yet reviewed", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      userId: "user-1",
      status: "PAID",
      items: [
        { gemstone: { id: "gem-1", name: "Sapphire", slug: "sapphire" }, jewelry: null },
        { gemstone: null, jewelry: { id: "jewelry-1", name: "Ring", slug: "ring" } },
      ],
    } as never);
    prismaMock.review.findMany.mockResolvedValue([]);
    const result = await getReviewableItems("order-1", "user-1");
    expect(result).toEqual([
      { kind: "gemstone", id: "gem-1", name: "Sapphire", slug: "sapphire" },
      { kind: "jewelry", id: "jewelry-1", name: "Ring", slug: "ring" },
    ]);
  });

  it("excludes an item the user has already reviewed", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      userId: "user-1",
      status: "PAID",
      items: [{ gemstone: { id: "gem-1", name: "Sapphire", slug: "sapphire" }, jewelry: null }],
    } as never);
    prismaMock.review.findMany.mockResolvedValue([{ gemstoneId: "gem-1", jewelryId: null }] as never);
    const result = await getReviewableItems("order-1", "user-1");
    expect(result).toEqual([]);
  });
});

describe("submitReview", () => {
  it("rejects when neither item id is given", async () => {
    const result = await submitReview({ userId: "user-1", rating: 5 });
    expect(result).toEqual({ ok: false, error: "No item specified." });
  });

  it("rejects a rating outside 1-5", async () => {
    const result = await submitReview({ userId: "user-1", gemstoneId: "gem-1", rating: 6 });
    expect(result.ok).toBe(false);
    const result2 = await submitReview({ userId: "user-1", gemstoneId: "gem-1", rating: 0 });
    expect(result2.ok).toBe(false);
  });

  it("rejects when there's no live-verified purchase of this item", async () => {
    prismaMock.orderItem.findFirst.mockResolvedValue(null);
    const result = await submitReview({ userId: "user-1", gemstoneId: "gem-1", rating: 5 });
    expect(result).toEqual({ ok: false, error: "You can only review items you've purchased." });
    expect(prismaMock.review.create).not.toHaveBeenCalled();
  });

  it("re-verifies the purchase against eligible order statuses only", async () => {
    prismaMock.orderItem.findFirst.mockResolvedValue({ id: "item-1" } as never);
    prismaMock.review.create.mockResolvedValue({} as never);
    await submitReview({ userId: "user-1", gemstoneId: "gem-1", rating: 5 });
    expect(prismaMock.orderItem.findFirst).toHaveBeenCalledWith({
      where: { order: { userId: "user-1", status: { in: ["PAID", "SHIPPED", "DELIVERED"] } }, gemstoneId: "gem-1", jewelryId: undefined },
    });
  });

  it("creates the review, trimming an empty body to null", async () => {
    prismaMock.orderItem.findFirst.mockResolvedValue({ id: "item-1" } as never);
    prismaMock.review.create.mockResolvedValue({} as never);
    const result = await submitReview({ userId: "user-1", gemstoneId: "gem-1", rating: 4, body: "  " });
    expect(result).toEqual({ ok: true });
    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: { userId: "user-1", gemstoneId: "gem-1", jewelryId: undefined, rating: 4, body: null },
    });
  });

  it("turns a duplicate-review unique-constraint violation into a friendly error", async () => {
    prismaMock.orderItem.findFirst.mockResolvedValue({ id: "item-1" } as never);
    prismaMock.review.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "6.19.3" }),
    );
    const result = await submitReview({ userId: "user-1", gemstoneId: "gem-1", rating: 5 });
    expect(result).toEqual({ ok: false, error: "You've already reviewed this item." });
  });
});

describe("getApprovedReviewsForItem", () => {
  it("returns a null average and 0 count with no approved reviews", async () => {
    prismaMock.review.findMany.mockResolvedValue([]);
    const result = await getApprovedReviewsForItem({ gemstoneId: "gem-1" });
    expect(result).toEqual({ average: null, count: 0, reviews: [] });
  });

  it("averages ratings and falls back to 'Verified Buyer' with no name on file", async () => {
    prismaMock.review.findMany.mockResolvedValue([
      { id: "r1", rating: 5, body: "Lovely", createdAt: new Date("2026-01-01"), user: { name: "Priya" } },
      { id: "r2", rating: 3, body: null, createdAt: new Date("2026-01-02"), user: { name: null } },
    ] as never);
    const result = await getApprovedReviewsForItem({ gemstoneId: "gem-1" });
    expect(result.average).toBe(4);
    expect(result.count).toBe(2);
    expect(result.reviews[1].reviewerName).toBe("Verified Buyer");
  });

  it("only queries APPROVED reviews for this exact item", async () => {
    prismaMock.review.findMany.mockResolvedValue([]);
    await getApprovedReviewsForItem({ jewelryId: "jewelry-1" });
    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "APPROVED", gemstoneId: undefined, jewelryId: "jewelry-1" } }),
    );
  });
});

describe("notifyReviewPromptAvailable", () => {
  it("skips notifying when the order has nothing reviewable", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ userId: "user-1", status: "PENDING_PAYMENT", items: [] } as never);
    await notifyReviewPromptAvailable({ id: "order-1", userId: "user-1" });
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("notifies pointing at the order page when there's something reviewable", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      userId: "user-1",
      status: "PAID",
      items: [{ gemstone: { id: "gem-1", name: "Sapphire", slug: "sapphire" }, jewelry: null }],
    } as never);
    prismaMock.review.findMany.mockResolvedValue([]);
    await notifyReviewPromptAvailable({ id: "order-1", userId: "user-1" });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", requestType: "order", requestId: "order-1" }),
    );
  });
});
