import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getJewelry } from "@/lib/catalog";

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
