import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { createShippingWeightTier, updateShippingWeightTier, deleteShippingWeightTier } from "@/actions/shipping-weight-tiers";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createShippingWeightTier", () => {
  it("rejects a blank label", async () => {
    const result = await createShippingWeightTier(formData({ label: "  ", ratePerOrderLKR: "500" }));
    expect(result).toEqual({ ok: false, error: "Enter a tier label." });
    expect(prismaMock.shippingWeightTier.create).not.toHaveBeenCalled();
  });

  it("rejects a negative or non-numeric rate", async () => {
    const result = await createShippingWeightTier(formData({ label: "Under 50g", ratePerOrderLKR: "-1" }));
    expect(result).toEqual({ ok: false, error: "Enter a valid rate." });
    expect(prismaMock.shippingWeightTier.create).not.toHaveBeenCalled();
  });

  it("creates the tier with the next sortOrder", async () => {
    prismaMock.shippingWeightTier.count.mockResolvedValue(2);
    prismaMock.shippingWeightTier.create.mockResolvedValue({ id: "tier-1" } as never);

    const result = await createShippingWeightTier(formData({ label: "Under 50g", ratePerOrderLKR: "500" }));

    expect(result).toEqual({ ok: true });
    expect(prismaMock.shippingWeightTier.create).toHaveBeenCalledWith({
      data: { label: "Under 50g", ratePerOrderLKR: 500, sortOrder: 3 },
    });
  });
});

describe("updateShippingWeightTier", () => {
  it("rejects a blank label", async () => {
    const result = await updateShippingWeightTier("tier-1", formData({ label: "", ratePerOrderLKR: "500" }));
    expect(result).toEqual({ ok: false, error: "Enter a tier label." });
    expect(prismaMock.shippingWeightTier.update).not.toHaveBeenCalled();
  });

  it("updates label/rate and derives active from the checkbox's presence", async () => {
    prismaMock.shippingWeightTier.update.mockResolvedValue({ id: "tier-1" } as never);

    const result = await updateShippingWeightTier("tier-1", formData({ label: "Under 50g", ratePerOrderLKR: "750" }));

    expect(result).toEqual({ ok: true });
    expect(prismaMock.shippingWeightTier.update).toHaveBeenCalledWith({
      where: { id: "tier-1" },
      data: { label: "Under 50g", ratePerOrderLKR: 750, active: false },
    });
  });
});

describe("deleteShippingWeightTier", () => {
  it("unassigns the tier from every gemstone/jewelry piece before deleting it", async () => {
    prismaMock.gemstone.updateMany.mockResolvedValue({ count: 2 } as never);
    prismaMock.jewelryPiece.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.shippingWeightTier.delete.mockResolvedValue({ id: "tier-1" } as never);

    const result = await deleteShippingWeightTier("tier-1");

    expect(result).toEqual({ ok: true });
    expect(prismaMock.gemstone.updateMany).toHaveBeenCalledWith({ where: { shippingWeightTierId: "tier-1" }, data: { shippingWeightTierId: null } });
    expect(prismaMock.jewelryPiece.updateMany).toHaveBeenCalledWith({ where: { shippingWeightTierId: "tier-1" }, data: { shippingWeightTierId: null } });
    expect(prismaMock.shippingWeightTier.delete).toHaveBeenCalledWith({ where: { id: "tier-1" } });
  });
});
