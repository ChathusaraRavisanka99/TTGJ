import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getWishlistedIds, toggleWishlist } from "@/lib/wishlist";

beforeEach(() => {
  prismaMock.wishlistItem.findMany.mockReset();
  prismaMock.wishlistItem.findFirst.mockReset();
  prismaMock.wishlistItem.create.mockReset();
  prismaMock.wishlistItem.delete.mockReset();
});

describe("getWishlistedIds", () => {
  it("returns an empty set for a guest (no userId)", async () => {
    const ids = await getWishlistedIds(null);
    expect(ids.size).toBe(0);
    expect(prismaMock.wishlistItem.findMany).not.toHaveBeenCalled();
  });

  it("collects both gemstone and jewelry ids into one set", async () => {
    prismaMock.wishlistItem.findMany.mockResolvedValue([
      { gemstoneId: "gem-1", jewelryId: null },
      { gemstoneId: null, jewelryId: "jewelry-1" },
    ] as never);
    const ids = await getWishlistedIds("user-1");
    expect(ids).toEqual(new Set(["gem-1", "jewelry-1"]));
  });
});

describe("toggleWishlist", () => {
  it("adds a gemstone that isn't saved yet", async () => {
    prismaMock.wishlistItem.findFirst.mockResolvedValue(null);
    prismaMock.wishlistItem.create.mockResolvedValue({} as never);
    const result = await toggleWishlist("user-1", { gemstoneId: "gem-1" });
    expect(result).toEqual({ saved: true });
    expect(prismaMock.wishlistItem.create).toHaveBeenCalledWith({ data: { userId: "user-1", gemstoneId: "gem-1", jewelryId: undefined } });
  });

  it("removes a gemstone that's already saved", async () => {
    prismaMock.wishlistItem.findFirst.mockResolvedValue({ id: "wish-1" } as never);
    prismaMock.wishlistItem.delete.mockResolvedValue({} as never);
    const result = await toggleWishlist("user-1", { gemstoneId: "gem-1" });
    expect(result).toEqual({ saved: false });
    expect(prismaMock.wishlistItem.delete).toHaveBeenCalledWith({ where: { id: "wish-1" } });
    expect(prismaMock.wishlistItem.create).not.toHaveBeenCalled();
  });

  it("adds a jewelry piece that isn't saved yet", async () => {
    prismaMock.wishlistItem.findFirst.mockResolvedValue(null);
    prismaMock.wishlistItem.create.mockResolvedValue({} as never);
    const result = await toggleWishlist("user-1", { jewelryId: "jewelry-1" });
    expect(result).toEqual({ saved: true });
    expect(prismaMock.wishlistItem.findFirst).toHaveBeenCalledWith({ where: { userId: "user-1", jewelryId: "jewelry-1" } });
  });
});
