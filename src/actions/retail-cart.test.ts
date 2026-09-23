import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { applyRetailDiscountCode, addToRetailCart } from "@/actions/retail-cart";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMarket } from "@/lib/market";

vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }) }));
vi.mock("@/lib/market", () => ({ getMarket: vi.fn().mockResolvedValue("intl") }));

describe("applyRetailDiscountCode rate limiting", () => {
  it("refuses once the per-user attempt limit is exceeded, before even normalizing the code", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const result = await applyRetailDiscountCode("WELCOME10");

    expect(result).toEqual({ ok: false, error: "Too many attempts — please wait a few minutes and try again." });
  });

  it("checks a per-user limit of 10 attempts per 10 minutes — a short custom code is otherwise guessable", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    await applyRetailDiscountCode("ABC");

    expect(checkRateLimit).toHaveBeenCalledWith("apply-discount:user-1", { limit: 10, windowSeconds: 10 * 60 });
  });
});

const cartFixture = { id: "cart-1", userId: "user-1", market: "intl", createdAt: new Date(), updatedAt: new Date(), discountCodeId: null, pointsToRedeem: 0 };

describe("addToRetailCart", () => {
  beforeEach(() => {
    vi.mocked(getMarket).mockResolvedValue("intl");
    prismaMock.retailCart.findUnique.mockResolvedValue(cartFixture as never);
  });

  it("adds a jewelry piece with no variants exactly as before", async () => {
    prismaMock.jewelryPiece.findUnique.mockResolvedValue({
      id: "jewelry-1", market: "intl", retailPrice: 500, lkrRetailPrice: null, stockStatus: "AVAILABLE", variants: [],
    } as never);
    prismaMock.retailCartItem.findFirst.mockResolvedValue(null);
    prismaMock.retailCartItem.create.mockResolvedValue({ id: "item-1" } as never);

    const result = await addToRetailCart({ jewelryId: "jewelry-1" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.retailCartItem.findFirst).toHaveBeenCalledWith({ where: { cartId: "cart-1", jewelryId: "jewelry-1", jewelryVariantId: null } });
    expect(prismaMock.retailCartItem.create).toHaveBeenCalledWith({
      data: { cartId: "cart-1", jewelryId: "jewelry-1", jewelryVariantId: null, quantity: 1, unitPrice: 500 },
    });
  });

  it("refreshes the price on a repeat add-to-cart click for a piece with no variants", async () => {
    prismaMock.jewelryPiece.findUnique.mockResolvedValue({
      id: "jewelry-1", market: "intl", retailPrice: 550, lkrRetailPrice: null, stockStatus: "AVAILABLE", variants: [],
    } as never);
    prismaMock.retailCartItem.findFirst.mockResolvedValue({ id: "item-1" } as never);
    prismaMock.retailCartItem.update.mockResolvedValue({ id: "item-1" } as never);

    const result = await addToRetailCart({ jewelryId: "jewelry-1" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.retailCartItem.update).toHaveBeenCalledWith({ where: { id: "item-1" }, data: { quantity: 1, unitPrice: 550 } });
    expect(prismaMock.retailCartItem.create).not.toHaveBeenCalled();
  });

  it("refuses a varianted piece when no variant is chosen", async () => {
    prismaMock.jewelryPiece.findUnique.mockResolvedValue({
      id: "jewelry-1", market: "intl", retailPrice: 500, lkrRetailPrice: null, stockStatus: "AVAILABLE",
      variants: [{ id: "variant-1", label: "Size 7", retailPrice: null, lkrRetailPrice: null, costPrice: null, stockStatus: "AVAILABLE" }],
    } as never);

    const result = await addToRetailCart({ jewelryId: "jewelry-1" });

    expect(result).toEqual({ ok: false, error: "Please choose an option." });
    expect(prismaMock.retailCartItem.upsert).not.toHaveBeenCalled();
  });

  it("refuses a variant that's no longer available, even though other variants of the same piece still are", async () => {
    prismaMock.jewelryPiece.findUnique.mockResolvedValue({
      id: "jewelry-1", market: "intl", retailPrice: 500, lkrRetailPrice: null, stockStatus: "AVAILABLE",
      variants: [
        { id: "variant-1", label: "Size 7", retailPrice: null, lkrRetailPrice: null, costPrice: null, stockStatus: "SOLD" },
        { id: "variant-2", label: "Size 8", retailPrice: null, lkrRetailPrice: null, costPrice: null, stockStatus: "AVAILABLE" },
      ],
    } as never);

    const result = await addToRetailCart({ jewelryId: "jewelry-1", jewelryVariantId: "variant-1" });

    expect(result).toEqual({ ok: false, error: "That option is no longer available." });
    expect(prismaMock.retailCartItem.upsert).not.toHaveBeenCalled();
  });

  it("uses the chosen variant's own price override over the piece's base price", async () => {
    prismaMock.jewelryPiece.findUnique.mockResolvedValue({
      id: "jewelry-1", market: "intl", retailPrice: 500, lkrRetailPrice: null, stockStatus: "AVAILABLE",
      variants: [{ id: "variant-1", label: "18K, Size 9", retailPrice: 650, lkrRetailPrice: null, costPrice: null, stockStatus: "AVAILABLE" }],
    } as never);
    prismaMock.retailCartItem.upsert.mockResolvedValue({ id: "item-1" } as never);

    const result = await addToRetailCart({ jewelryId: "jewelry-1", jewelryVariantId: "variant-1" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.retailCartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cartId_jewelryId_jewelryVariantId: { cartId: "cart-1", jewelryId: "jewelry-1", jewelryVariantId: "variant-1" } },
        create: expect.objectContaining({ jewelryVariantId: "variant-1", unitPrice: 650 }),
      }),
    );
  });

  it("falls back to the piece's base price when the chosen variant has no override", async () => {
    prismaMock.jewelryPiece.findUnique.mockResolvedValue({
      id: "jewelry-1", market: "intl", retailPrice: 500, lkrRetailPrice: null, stockStatus: "AVAILABLE",
      variants: [{ id: "variant-1", label: "Size 7", retailPrice: null, lkrRetailPrice: null, costPrice: null, stockStatus: "AVAILABLE" }],
    } as never);
    prismaMock.retailCartItem.upsert.mockResolvedValue({ id: "item-1" } as never);

    const result = await addToRetailCart({ jewelryId: "jewelry-1", jewelryVariantId: "variant-1" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.retailCartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ unitPrice: 500 }) }),
    );
  });
});
