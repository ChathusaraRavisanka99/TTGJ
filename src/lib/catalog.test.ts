import { describe, it, expect, beforeEach, type Mock } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getJewelry, getGemCategories, getJewelryCategoryData } from "@/lib/catalog";

beforeEach(() => {
  prismaMock.jewelryPiece.findMany.mockResolvedValue([]);
  prismaMock.jewelryPiece.count.mockResolvedValue(0);
});

describe("getJewelry audience filter", () => {
  it("includes unisex pieces when browsing Women or Men", async () => {
    await getJewelry({ audience: ["women"] });
    expect(prismaMock.jewelryPiece.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ audience: { in: ["WOMEN", "UNISEX"] } }) }));

    await getJewelry({ audience: ["men"] });
    expect(prismaMock.jewelryPiece.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({ audience: { in: ["MEN", "UNISEX"] } }) }));
  });

  it("keeps Couple exact and merges several audiences without duplicates", async () => {
    await getJewelry({ audience: ["couple"] });
    expect(prismaMock.jewelryPiece.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({ audience: { in: ["COUPLE"] } }) }));

    await getJewelry({ audience: ["women", "men"] });
    expect(prismaMock.jewelryPiece.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ audience: { in: ["WOMEN", "UNISEX", "MEN"] } }) }),
    );
  });

  it("ignores an unknown audience instead of filtering everything out", async () => {
    await getJewelry({ audience: ["kids"] });
    const where = prismaMock.jewelryPiece.findMany.mock.calls.at(-1)?.[0]?.where as Record<string, unknown>;
    expect(where.audience).toBeUndefined();
  });

  it("combines with a piece type", async () => {
    await getJewelry({ audience: ["women"], pieceType: ["RING"] });
    expect(prismaMock.jewelryPiece.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ audience: { in: ["WOMEN", "UNISEX"] }, pieceType: { in: ["RING"] } }) }),
    );
  });
});

describe("getGemCategories", () => {
  it("builds one tile per mineral with stones, using one cover query for all of them", async () => {
    (prismaMock.gemstone.groupBy as unknown as Mock).mockResolvedValue([
      { mineralId: "m-sap", _count: { _all: 3 } },
      { mineralId: "m-rub", _count: { _all: 1 } },
    ] as never);
    prismaMock.mineral.findMany.mockResolvedValue([
      { id: "m-sap", slug: "sapphire", name: "Sapphire" },
      { id: "m-rub", slug: "ruby", name: "Ruby" },
      { id: "m-emp", slug: "emerald", name: "Emerald" },
    ] as never);
    prismaMock.gemstone.findMany.mockResolvedValue([
      { mineralId: "m-sap", media: [{ url: "/media/sap.webp" }] },
      { mineralId: "m-rub", media: [] },
    ] as never);

    const result = await getGemCategories("intl");

    expect(result.total).toBe(4);
    expect(result.tiles).toEqual([
      { key: "sapphire", label: "Sapphire", href: "/gems?mineral=sapphire", count: 3, image: "/media/sap.webp" },
      { key: "ruby", label: "Ruby", href: "/gems?mineral=ruby", count: 1, image: null },
    ]);
    expect(result.cover).toBe("/media/sap.webp");
    expect(prismaMock.gemstone.findMany).toHaveBeenCalledTimes(1);
  });
});

describe("getJewelryCategoryData", () => {
  const setup = () => {
    (prismaMock.jewelryPiece.groupBy as unknown as Mock).mockResolvedValue([
      { audience: "WOMEN", pieceType: "RING", _count: { _all: 2 } },
      { audience: "MEN", pieceType: "RING", _count: { _all: 1 } },
      { audience: "UNISEX", pieceType: "ANKLET", _count: { _all: 1 } },
      { audience: "COUPLE", pieceType: "JEWELRY_SET", _count: { _all: 1 } },
    ] as never);
    // newest first, as the query orders them
    prismaMock.jewelryPiece.findMany.mockResolvedValue([
      { audience: "UNISEX", pieceType: "ANKLET", createdAt: new Date(), media: [{ url: "/media/anklet.webp" }] },
      { audience: "WOMEN", pieceType: "RING", createdAt: new Date(), media: [{ url: "/media/w-ring.webp" }] },
      { audience: "COUPLE", pieceType: "JEWELRY_SET", createdAt: new Date(), media: [{ url: "/media/set.webp" }] },
    ] as never);
  };

  it("counts Men and Women including Unisex, and Couple and Unisex exactly", async () => {
    setup();
    const data = await getJewelryCategoryData("intl");
    const count = Object.fromEntries(data.audiences.map((a) => [a.slug, a.count]));
    expect(count).toEqual({ women: 3, men: 2, couple: 1, unisex: 1 });
    expect(data.total).toBe(5);
  });

  it("picks each tile's cover from the newest matching piece, in two queries", async () => {
    setup();
    const data = await getJewelryCategoryData("intl");
    const cover = Object.fromEntries(data.audiences.map((a) => [a.slug, a.image]));
    expect(cover.women).toBe("/media/anklet.webp"); // the newest of women+unisex
    expect(cover.couple).toBe("/media/set.webp");
    expect(data.cover).toBe("/media/anklet.webp");
    expect(prismaMock.jewelryPiece.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.jewelryPiece.groupBy).toHaveBeenCalledTimes(1);
  });

  it("lists an audience's piece types in display order, only those with stock", async () => {
    setup();
    const data = await getJewelryCategoryData("intl");
    const women = await data.typesFor("women");
    expect(women.map((t) => [t.type, t.count])).toEqual([["RING", 2], ["ANKLET", 1]]);
    const men = await data.typesFor("men");
    expect(men.map((t) => t.type)).toEqual(["RING", "ANKLET"]);
    expect((await data.typesFor("couple")).map((t) => t.type)).toEqual(["JEWELRY_SET"]);
  });
});
