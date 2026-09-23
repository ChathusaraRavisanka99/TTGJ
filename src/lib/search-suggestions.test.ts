import { describe, it, expect } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getQuickSearchSuggestions } from "@/lib/search-suggestions";

const baseGem = {
  id: "gem-1",
  slug: "blue-sapphire",
  name: "Ceylon Blue Sapphire",
  retailPrice: 5000,
  lkrRetailPrice: null,
  price: null,
  lkrPrice: null,
  showPrice: false,
  media: [{ url: "/gem.jpg" }],
};

describe("getQuickSearchSuggestions", () => {
  it("returns nothing for a query under 2 characters, without touching the database", async () => {
    const result = await getQuickSearchSuggestions("s", "intl");

    expect(result).toEqual({ gems: [], jewelry: [] });
    expect(prismaMock.gemstone.findMany).not.toHaveBeenCalled();
  });

  it("maps a matching gemstone with its retail price, in the requesting market", async () => {
    prismaMock.gemstone.findMany.mockResolvedValue([baseGem] as never);
    prismaMock.jewelryPiece.findMany.mockResolvedValue([] as never);

    const result = await getQuickSearchSuggestions("sapphire", "intl");

    expect(result.gems).toEqual([{ id: "gem-1", slug: "blue-sapphire", name: "Ceylon Blue Sapphire", imageUrl: "/gem.jpg", price: 5000, currency: "USD" }]);
  });

  it("falls back to the quote-reference price only when showPrice is on and there's no retail price", async () => {
    prismaMock.gemstone.findMany.mockResolvedValue([{ ...baseGem, retailPrice: null, price: 4200, showPrice: true }] as never);
    prismaMock.jewelryPiece.findMany.mockResolvedValue([] as never);

    const result = await getQuickSearchSuggestions("sapphire", "intl");

    expect(result.gems[0].price).toBe(4200);
  });

  it("shows no price at all when there's no retail price and showPrice is off", async () => {
    prismaMock.gemstone.findMany.mockResolvedValue([{ ...baseGem, retailPrice: null, price: 4200, showPrice: false }] as never);
    prismaMock.jewelryPiece.findMany.mockResolvedValue([] as never);

    const result = await getQuickSearchSuggestions("sapphire", "intl");

    expect(result.gems[0].price).toBeNull();
  });

  it("uses the LKR columns and currency on the lk market", async () => {
    prismaMock.gemstone.findMany.mockResolvedValue([{ ...baseGem, retailPrice: null, lkrRetailPrice: 950000 }] as never);
    prismaMock.jewelryPiece.findMany.mockResolvedValue([] as never);

    const result = await getQuickSearchSuggestions("sapphire", "lk");

    expect(result.gems[0]).toEqual(expect.objectContaining({ price: 950000, currency: "LKR" }));
    expect(prismaMock.gemstone.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ market: "lk" }) }));
  });
});
