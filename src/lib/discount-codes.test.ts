import { describe, it, expect } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { normalizeCode, cartTotal, discountCodeError, finalizeDiscountRedemption, generateUniqueCode } from "@/lib/discount-codes";

describe("normalizeCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeCode("  welcome50 ")).toBe("WELCOME50");
  });
});

describe("cartTotal", () => {
  it("sums item amounts", () => {
    expect(cartTotal([{ amount: 10 }, { amount: 25.5 }], null)).toBe(35.5);
  });

  it("subtracts a discount amount", () => {
    expect(cartTotal([{ amount: 100 }], 20)).toBe(80);
  });

  it("treats a missing discount as zero", () => {
    expect(cartTotal([{ amount: 100 }], undefined)).toBe(100);
  });

  it("never goes below zero", () => {
    expect(cartTotal([{ amount: 10 }], 50)).toBe(0);
  });
});

describe("discountCodeError", () => {
  const base = { active: true, expiresAt: null, scope: "PUBLIC", assignedUserId: null, maxUses: null, usesCount: 0 };

  it("passes a plain active, unlimited code", () => {
    expect(discountCodeError(base, "user-1")).toBeNull();
  });

  it("rejects an inactive code", () => {
    expect(discountCodeError({ ...base, active: false }, "user-1")).toMatch(/no longer active/i);
  });

  it("rejects an expired code", () => {
    expect(discountCodeError({ ...base, expiresAt: new Date(Date.now() - 1000) }, "user-1")).toMatch(/expired/i);
  });

  it("accepts a code that expires in the future", () => {
    expect(discountCodeError({ ...base, expiresAt: new Date(Date.now() + 100000) }, "user-1")).toBeNull();
  });

  it("rejects a customer-scoped code for the wrong customer", () => {
    const err = discountCodeError({ ...base, scope: "CUSTOMER", assignedUserId: "user-2" }, "user-1");
    expect(err).toMatch(/isn't valid for your account/i);
  });

  it("accepts a customer-scoped code for the assigned customer", () => {
    expect(discountCodeError({ ...base, scope: "CUSTOMER", assignedUserId: "user-1" }, "user-1")).toBeNull();
  });

  it("rejects a code that has hit its usage limit", () => {
    expect(discountCodeError({ ...base, maxUses: 5, usesCount: 5 }, "user-1")).toMatch(/usage limit/i);
  });

  it("accepts a code with uses remaining", () => {
    expect(discountCodeError({ ...base, maxUses: 5, usesCount: 4 }, "user-1")).toBeNull();
  });
});

describe("generateUniqueCode", () => {
  it("returns a code once findUnique reports no collision", async () => {
    prismaMock.discountCode.findUnique.mockResolvedValue(null);
    const code = await generateUniqueCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  });

  it("retries past a collision", async () => {
    prismaMock.discountCode.findUnique
      .mockResolvedValueOnce({ id: "existing" } as never)
      .mockResolvedValueOnce(null);
    await generateUniqueCode();
    expect(prismaMock.discountCode.findUnique).toHaveBeenCalledTimes(2);
  });
});

describe("finalizeDiscountRedemption", () => {
  it("increments usesCount and records a redemption for a valid code", async () => {
    const discount = { id: "code-1", active: true, expiresAt: null, scope: "PUBLIC", assignedUserId: null, maxUses: null, usesCount: 0 };
    prismaMock.discountCode.findUnique.mockResolvedValue(discount as never);
    prismaMock.discountCode.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.discountCodeRedemption.create.mockResolvedValue({} as never);

    const result = await finalizeDiscountRedemption({ discountCodeId: "code-1", userId: "user-1", orderId: "order-1" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.discountCodeRedemption.create).toHaveBeenCalledWith({
      data: { discountCodeId: "code-1", userId: "user-1", cartId: undefined, orderId: "order-1" },
    });
  });

  it("fails without redeeming when the code no longer exists", async () => {
    prismaMock.discountCode.findUnique.mockResolvedValue(null);
    const result = await finalizeDiscountRedemption({ discountCodeId: "missing", userId: "user-1" });
    expect(result.ok).toBe(false);
    expect(prismaMock.discountCodeRedemption.create).not.toHaveBeenCalled();
  });

  it("fails when a concurrent redemption claims the last use first (the updateMany race)", async () => {
    // Passes the soft discountCodeError check (usesCount is still under
    // maxUses when read) but the conditional updateMany claims 0 rows —
    // someone else's finalize won the race between this read and this write.
    const discount = { id: "code-1", active: true, expiresAt: null, scope: "PUBLIC", assignedUserId: null, maxUses: 1, usesCount: 0 };
    prismaMock.discountCode.findUnique.mockResolvedValue(discount as never);
    prismaMock.discountCode.updateMany.mockResolvedValue({ count: 0 });

    const result = await finalizeDiscountRedemption({ discountCodeId: "code-1", userId: "user-1" });

    expect(result.ok).toBe(false);
    expect(prismaMock.discountCode.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.discountCodeRedemption.create).not.toHaveBeenCalled();
  });
});
