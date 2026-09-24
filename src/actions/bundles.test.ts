import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { createBundle, toggleBundleActive, deleteBundle } from "@/actions/bundles";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = { name: "Sapphire Ring + Matching Studs", market: "intl", price: "700" };

beforeEach(() => {
  prismaMock.gemstone.count.mockResolvedValue(0);
  prismaMock.jewelryPiece.count.mockResolvedValue(0);
  prismaMock.bundle.create.mockResolvedValue({} as never);
});

describe("createBundle", () => {
  it("rejects a blank name", async () => {
    const result = await createBundle(formData({ ...validFields, name: "", items: JSON.stringify([{ gemstoneId: "g1" }, { gemstoneId: "g2" }]) }));
    expect(result.ok).toBe(false);
    expect(prismaMock.bundle.create).not.toHaveBeenCalled();
  });

  it("rejects a price of 0 or less", async () => {
    const result = await createBundle(formData({ ...validFields, price: "0", items: JSON.stringify([{ gemstoneId: "g1" }, { gemstoneId: "g2" }]) }));
    expect(result.ok).toBe(false);
    expect(prismaMock.bundle.create).not.toHaveBeenCalled();
  });

  it("rejects fewer than 2 items", async () => {
    const result = await createBundle(formData({ ...validFields, items: JSON.stringify([{ gemstoneId: "g1" }]) }));
    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toMatch(/at least 2/i);
    expect(prismaMock.bundle.create).not.toHaveBeenCalled();
  });

  it("rejects malformed items JSON", async () => {
    const result = await createBundle(formData({ ...validFields, items: "not json" }));
    expect(result.ok).toBe(false);
    expect(prismaMock.bundle.create).not.toHaveBeenCalled();
  });

  it("rejects when a referenced item isn't found in this store's catalog", async () => {
    prismaMock.gemstone.count.mockResolvedValue(1); // only 1 of the 2 referenced ids actually exists
    const result = await createBundle(formData({ ...validFields, items: JSON.stringify([{ gemstoneId: "g1" }, { gemstoneId: "g2" }]) }));
    expect(result).toEqual({ ok: false, error: "One or more items weren't found in this store's catalog." });
    expect(prismaMock.bundle.create).not.toHaveBeenCalled();
  });

  it("creates a bundle with valid gemstone items", async () => {
    prismaMock.gemstone.count.mockResolvedValue(2);
    const result = await createBundle(formData({ ...validFields, items: JSON.stringify([{ gemstoneId: "g1" }, { gemstoneId: "g2" }]) }));
    expect(result).toEqual({ ok: true });
    expect(prismaMock.bundle.create).toHaveBeenCalledWith({
      data: {
        name: "Sapphire Ring + Matching Studs",
        market: "intl",
        price: 700,
        items: { create: [{ gemstoneId: "g1", jewelryId: undefined }, { gemstoneId: "g2", jewelryId: undefined }] },
      },
    });
  });

  it("checks jewelry items against the jewelry catalog, not gemstones", async () => {
    prismaMock.jewelryPiece.count.mockResolvedValue(2);
    const result = await createBundle(formData({ ...validFields, items: JSON.stringify([{ jewelryId: "j1" }, { jewelryId: "j2" }]) }));
    expect(result).toEqual({ ok: true });
    expect(prismaMock.gemstone.count).not.toHaveBeenCalled();
  });
});

describe("toggleBundleActive", () => {
  it("updates the bundle's active flag", async () => {
    prismaMock.bundle.update.mockResolvedValue({} as never);
    const result = await toggleBundleActive("bundle-1", false);
    expect(result).toEqual({ ok: true });
    expect(prismaMock.bundle.update).toHaveBeenCalledWith({ where: { id: "bundle-1" }, data: { active: false } });
  });
});

describe("deleteBundle", () => {
  it("deletes the bundle", async () => {
    prismaMock.bundle.delete.mockResolvedValue({} as never);
    const result = await deleteBundle("bundle-1");
    expect(result).toEqual({ ok: true });
    expect(prismaMock.bundle.delete).toHaveBeenCalledWith({ where: { id: "bundle-1" } });
  });
});
