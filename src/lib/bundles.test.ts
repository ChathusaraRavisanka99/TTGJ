import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getBundlesForItem } from "@/lib/bundles";

beforeEach(() => {
  prismaMock.bundle.findMany.mockReset();
});

describe("getBundlesForItem", () => {
  it("shapes a bundle's items with USD prices on the international store", async () => {
    prismaMock.bundle.findMany.mockResolvedValue([
      {
        id: "bundle-1",
        name: "Sapphire Ring + Matching Studs",
        price: 700,
        items: [
          { gemstone: { id: "gem-1", slug: "sapphire-ring", name: "Sapphire Ring", retailPrice: 500, lkrRetailPrice: 150000, media: [{ url: "https://x/ring.jpg" }] }, jewelry: null },
          { gemstone: null, jewelry: { id: "jewelry-1", slug: "matching-studs", name: "Matching Studs", retailPrice: 350, lkrRetailPrice: 105000, media: [] } },
        ],
      },
    ] as never);

    const result = await getBundlesForItem("gem-1", "intl");

    expect(result).toEqual([
      {
        id: "bundle-1",
        name: "Sapphire Ring + Matching Studs",
        price: 700,
        items: [
          { kind: "gemstone", id: "gem-1", slug: "sapphire-ring", name: "Sapphire Ring", imageUrl: "https://x/ring.jpg", price: 500 },
          { kind: "jewelry", id: "jewelry-1", slug: "matching-studs", name: "Matching Studs", imageUrl: undefined, price: 350 },
        ],
      },
    ]);
  });

  it("uses LKR prices on the Sri Lanka store", async () => {
    prismaMock.bundle.findMany.mockResolvedValue([
      {
        id: "bundle-1", name: "Set", price: 200000,
        items: [{ gemstone: { id: "gem-1", slug: "s", name: "S", retailPrice: 500, lkrRetailPrice: 150000, media: [] }, jewelry: null }],
      },
    ] as never);

    const result = await getBundlesForItem("gem-1", "lk");

    expect(result[0].items[0].price).toBe(150000);
  });

  it("skips a bundle item whose linked catalog row has since been deleted", async () => {
    prismaMock.bundle.findMany.mockResolvedValue([
      { id: "bundle-1", name: "Set", price: 700, items: [{ gemstone: null, jewelry: null }] },
    ] as never);

    const result = await getBundlesForItem("gem-1", "intl");

    expect(result[0].items).toEqual([]);
  });
});
