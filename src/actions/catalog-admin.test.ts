import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { deleteGemstone, deleteJewelry } from "@/actions/catalog-admin";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));

describe("deleteGemstone", () => {
  it("refuses to delete a gemstone with paid order history", async () => {
    prismaMock.gemstone.findUnique.mockResolvedValue({ id: "gem-1", _count: { orderItems: 1, quoteRequests: 0, auctions: 0 } } as never);

    const result = await deleteGemstone("gem-1");

    expect(result.ok).toBe(false);
    expect(prismaMock.gemstone.delete).not.toHaveBeenCalled();
  });

  it("refuses to delete a gemstone with quote-request history", async () => {
    prismaMock.gemstone.findUnique.mockResolvedValue({ id: "gem-1", _count: { orderItems: 0, quoteRequests: 2, auctions: 0 } } as never);

    const result = await deleteGemstone("gem-1");

    expect(result.ok).toBe(false);
    expect(prismaMock.gemstone.delete).not.toHaveBeenCalled();
  });

  it("refuses to delete a gemstone with auction history", async () => {
    prismaMock.gemstone.findUnique.mockResolvedValue({ id: "gem-1", _count: { orderItems: 0, quoteRequests: 0, auctions: 1 } } as never);

    const result = await deleteGemstone("gem-1");

    expect(result.ok).toBe(false);
    expect(prismaMock.gemstone.delete).not.toHaveBeenCalled();
  });

  it("allows deleting a gemstone with no order/quote/auction history", async () => {
    prismaMock.gemstone.findUnique.mockResolvedValue({ id: "gem-1", _count: { orderItems: 0, quoteRequests: 0, auctions: 0 } } as never);
    prismaMock.gemstone.delete.mockResolvedValue({} as never);

    const result = await deleteGemstone("gem-1");

    expect(result).toEqual({ ok: true });
    expect(prismaMock.gemstone.delete).toHaveBeenCalledWith({ where: { id: "gem-1" } });
  });

  it("returns a clean error for an id that doesn't exist, rather than throwing", async () => {
    prismaMock.gemstone.findUnique.mockResolvedValue(null);
    const result = await deleteGemstone("missing");
    expect(result.ok).toBe(false);
  });
});

describe("deleteJewelry", () => {
  it("refuses to delete a piece with order/quote/auction history", async () => {
    prismaMock.jewelryPiece.findUnique.mockResolvedValue({ id: "jew-1", _count: { orderItems: 1, quoteRequests: 0, auctions: 0 } } as never);

    const result = await deleteJewelry("jew-1");

    expect(result.ok).toBe(false);
    expect(prismaMock.jewelryPiece.delete).not.toHaveBeenCalled();
  });

  it("allows deleting a piece with no history", async () => {
    prismaMock.jewelryPiece.findUnique.mockResolvedValue({ id: "jew-1", _count: { orderItems: 0, quoteRequests: 0, auctions: 0 } } as never);
    prismaMock.jewelryPiece.delete.mockResolvedValue({} as never);

    const result = await deleteJewelry("jew-1");

    expect(result).toEqual({ ok: true });
    expect(prismaMock.jewelryPiece.delete).toHaveBeenCalledWith({ where: { id: "jew-1" } });
  });
});
