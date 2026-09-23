import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { isSriLanka, buildCheckoutBreakdown } from "@/lib/checkout";
import { getActivePromotionMaps } from "@/lib/promotion-items";
import { resolveShippingRate } from "@/lib/shipping";

vi.mock("@/lib/promotion-items", () => ({ getActivePromotionMaps: vi.fn() }));
vi.mock("@/lib/shipping", () => ({ resolveShippingRate: vi.fn() }));

describe("isSriLanka", () => {
  it.each(["Sri Lanka", "sri lanka", "SRI LANKA", "  Sri Lanka  ", "SriLanka", "Ceylon", "LK"])(
    "recognizes %j as Sri Lanka",
    (country) => {
      expect(isSriLanka(country)).toBe(true);
    },
  );

  it.each(["United States", "India", "", "Sri Lankaa", "Not Sri Lanka"])("does not recognize %j as Sri Lanka", (country) => {
    expect(isSriLanka(country)).toBe(false);
  });
});

const commerceFixture = {
  id: "singleton", vatPercent: 18, applyVatToInternational: false, gatewayCommissionPercent: 3.5,
  handlingFeeMarginPercent: 1, birthdayDiscountPercent: 10, usdToLkrRate: 300, updatedAt: new Date(),
};

const userFixture = { id: "user-1", pointsBalance: 0, dateOfBirth: null, lastBirthdayDiscountAt: null };

function gemCartItem(overrides: Record<string, unknown> = {}) {
  return {
    gemstoneId: "gem-1",
    jewelryId: null,
    quantity: 1,
    unitPrice: 100,
    gemstone: { id: "gem-1", name: "Blue Sapphire", stockStatus: "AVAILABLE", retailPrice: 100, lkrRetailPrice: 30000, costPrice: 60 },
    jewelry: null,
    jewelryVariant: null,
    ...overrides,
  };
}

function jewelryCartItem(overrides: Record<string, unknown> = {}) {
  return {
    gemstoneId: null,
    jewelryId: "jewelry-1",
    jewelryVariantId: null,
    quantity: 1,
    unitPrice: 500,
    gemstone: null,
    jewelry: { id: "jewelry-1", name: "Signet Ring", stockStatus: "AVAILABLE", retailPrice: 500, lkrRetailPrice: 150000, costPrice: 300 },
    jewelryVariant: null,
    ...overrides,
  };
}

describe("buildCheckoutBreakdown", () => {
  beforeEach(() => {
    prismaMock.commerceSettings.findUnique.mockResolvedValue(commerceFixture as never);
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(userFixture as never);
    prismaMock.loyaltySettings.findUnique.mockResolvedValue({
      id: "singleton", pointsPerCurrencyUnit: 1, pointsRedemptionValue: 0.01, minRedeemPoints: 500,
      maxRedeemPercentOfOrder: 50, referralMinOrderValue: 50, referralReferrerBonusPoints: 500,
      referralRefereeBonusPoints: 250, updatedAt: new Date(),
    } as never);
    vi.mocked(getActivePromotionMaps).mockResolvedValue({ themeLabel: null, gemstonePrices: new Map(), jewelryPrices: new Map() });
    vi.mocked(resolveShippingRate).mockResolvedValue({ zoneLabel: "Rest of World", rateLKR: 3000 });
  });

  it("throws when the cart is empty", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({ items: [], pointsToRedeem: 0, discountCode: null } as never);
    await expect(buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" })).rejects.toThrow(/empty/i);
  });

  it("throws when the cart has no row at all", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue(null);
    await expect(buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" })).rejects.toThrow(/empty/i);
  });

  it("throws when an item in the cart is no longer available", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({
      items: [gemCartItem({ gemstone: { id: "gem-1", name: "Blue Sapphire", stockStatus: "SOLD", retailPrice: 100, lkrRetailPrice: 30000, costPrice: 60 } })],
      pointsToRedeem: 0, discountCode: null,
    } as never);
    await expect(buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" })).rejects.toThrow(/no longer available/i);
  });

  it("throws on /lk when an item has no rupee price", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({
      items: [gemCartItem({ gemstone: { id: "gem-1", name: "Blue Sapphire", stockStatus: "AVAILABLE", retailPrice: 100, lkrRetailPrice: null, costPrice: 60 } })],
      pointsToRedeem: 0, discountCode: null,
    } as never);
    await expect(buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "Sri Lanka", market: "lk" })).rejects.toThrow(/can't be bought online in rupees/i);
  });

  it("computes subtotal, VAT (domestic), converted shipping, and gateway handling fee for a card order", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({ items: [gemCartItem()], pointsToRedeem: 0, discountCode: null } as never);
    // domestic (Sri Lanka shipping address) triggers VAT even on the intl store, per lib/checkout.ts's own rule
    vi.mocked(resolveShippingRate).mockResolvedValue({ zoneLabel: "Sri Lanka", rateLKR: 3000 });

    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "Sri Lanka", market: "intl", paymentMethod: "PAYHERE_CARD" });

    expect(result.subtotal).toBe(100);
    expect(result.shipping).toBeCloseTo(3000 / 300); // converted through usdToLkrRate
    expect(result.tax).toBeCloseTo(100 * 0.18);
    expect(result.handlingFee).toBeGreaterThan(0); // (3.5 + 1)% of the gateway-charged amount
    expect(result.currency).toBe("USD");
  });

  it("charges no VAT on a non-domestic international order (export, zero-rated by default)", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({ items: [gemCartItem()], pointsToRedeem: 0, discountCode: null } as never);
    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States", market: "intl" });
    expect(result.tax).toBe(0);
  });

  it("charges no handling fee for a non-card payment method", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({ items: [gemCartItem()], pointsToRedeem: 0, discountCode: null } as never);
    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States", market: "intl", paymentMethod: "WIRE_TRANSFER" });
    expect(result.handlingFee).toBe(0);
  });

  it("applies the birthday discount off profit margin when eligible and the item isn't promotional", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({ items: [gemCartItem()], pointsToRedeem: 0, discountCode: null } as never);
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ ...userFixture, dateOfBirth: new Date(new Date().getFullYear() - 30, new Date().getMonth(), 15) } as never);

    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" });

    // profit = 100 - 60 = 40; 10% of that = 4
    expect(result.birthdayEligible).toBe(true);
    expect(result.birthdayDiscount).toBeCloseTo(4);
  });

  it("does not apply the birthday discount to a promotional item, even when eligible", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({ items: [gemCartItem()], pointsToRedeem: 0, discountCode: null } as never);
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ ...userFixture, dateOfBirth: new Date(new Date().getFullYear() - 30, new Date().getMonth(), 15) } as never);
    vi.mocked(getActivePromotionMaps).mockResolvedValue({ themeLabel: "Sale", gemstonePrices: new Map([["gem-1", 90]]), jewelryPrices: new Map() });

    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" });

    expect(result.birthdayDiscount).toBe(0);
  });

  it("applies a USD discount code on the international store", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({
      items: [gemCartItem()], pointsToRedeem: 0,
      discountCode: { id: "code-1", amountOff: 15, amountOffLkr: null },
    } as never);
    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" });
    expect(result.codeDiscount).toBe(15);
    expect(result.discountCodeId).toBe("code-1");
  });

  it("ignores a discount code on /lk that has no rupee value set", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({
      items: [gemCartItem()], pointsToRedeem: 0,
      discountCode: { id: "code-1", amountOff: 15, amountOffLkr: null },
    } as never);
    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "Sri Lanka", market: "lk" });
    expect(result.codeDiscount).toBe(0);
    expect(result.discountCodeId).toBeNull();
  });

  it("uses LKR retail prices and applies no currency conversion at all on /lk", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({ items: [gemCartItem()], pointsToRedeem: 0, discountCode: null } as never);
    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "Sri Lanka", market: "lk", paymentMethod: "WIRE_TRANSFER" });
    expect(result.currency).toBe("LKR");
    expect(result.subtotal).toBe(30000); // lkrRetailPrice, not retailPrice
    expect(result.shipping).toBe(3000); // used as-is, no /usdToLkrRate conversion
  });

  it("clamps staged points redemption through resolvePointsRedemption rather than trusting the cart's stored amount", async () => {
    prismaMock.retailCart.findUnique.mockResolvedValue({ items: [gemCartItem()], pointsToRedeem: 100000, discountCode: null } as never);
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ ...userFixture, pointsBalance: 10000 } as never);

    const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" });

    // cap = subtotal(100) * 50% = $50 -> 5000 points -> $50 discount
    expect(result.pointsRedeemed).toBe(5000);
    expect(result.pointsDiscount).toBeCloseTo(50);
  });

  describe("shipping weight tiers and quoteShipping", () => {
    it("replaces the destination zone rate with a single item's weight-tier rate", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [gemCartItem({ gemstone: { id: "gem-1", name: "Blue Sapphire", stockStatus: "AVAILABLE", retailPrice: 100, lkrRetailPrice: 30000, costPrice: 60, shippingWeightTier: { ratePerOrderLKR: 800 }, quoteShipping: false } })],
        pointsToRedeem: 0, discountCode: null,
      } as never);

      const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States", market: "intl", paymentMethod: "WIRE_TRANSFER" });

      // tier rate (800 LKR) replaces the 3000 LKR zone rate entirely, converted at usdToLkrRate
      expect(result.shipping).toBeCloseTo(800 / 300);
      expect(result.shippingToBeArranged).toBe(false);
    });

    it("sums weight-tier rates across multiple tiered items and quantities, ignoring the zone rate", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [
          gemCartItem({ gemstoneId: "gem-1", quantity: 2, gemstone: { id: "gem-1", name: "Sapphire", stockStatus: "AVAILABLE", retailPrice: 100, lkrRetailPrice: 30000, costPrice: 60, shippingWeightTier: { ratePerOrderLKR: 500 }, quoteShipping: false } }),
          gemCartItem({ gemstoneId: "gem-2", quantity: 1, gemstone: { id: "gem-2", name: "Ruby", stockStatus: "AVAILABLE", retailPrice: 200, lkrRetailPrice: 60000, costPrice: 120, shippingWeightTier: { ratePerOrderLKR: 900 }, quoteShipping: false } }),
        ],
        pointsToRedeem: 0, discountCode: null,
      } as never);

      const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "Sri Lanka", market: "lk", paymentMethod: "WIRE_TRANSFER" });

      // (500 * 2) + (900 * 1) = 1900, LKR as-is on /lk
      expect(result.shipping).toBe(1900);
    });

    it("blends a tiered item's rate with the zone rate for an untiered item in the same cart", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [
          gemCartItem({ gemstoneId: "gem-1", gemstone: { id: "gem-1", name: "Sapphire", stockStatus: "AVAILABLE", retailPrice: 100, lkrRetailPrice: 30000, costPrice: 60, shippingWeightTier: { ratePerOrderLKR: 500 }, quoteShipping: false } }),
          gemCartItem({ gemstoneId: "gem-2", gemstone: { id: "gem-2", name: "Ruby", stockStatus: "AVAILABLE", retailPrice: 200, lkrRetailPrice: 60000, costPrice: 120, shippingWeightTier: null, quoteShipping: false } }),
        ],
        pointsToRedeem: 0, discountCode: null,
      } as never);

      const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "Sri Lanka", market: "lk", paymentMethod: "WIRE_TRANSFER" });

      // tiered item's 500 + the untiered item's share of the flat 3000 zone rate (charged once, not per item)
      expect(result.shipping).toBe(500 + 3000);
    });

    it("charges $0 shipping for a quoteShipping item and flags the order as needing shipping arranged", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [gemCartItem({ gemstone: { id: "gem-1", name: "Blue Sapphire", stockStatus: "AVAILABLE", retailPrice: 100, lkrRetailPrice: 30000, costPrice: 60, shippingWeightTier: null, quoteShipping: true } })],
        pointsToRedeem: 0, discountCode: null,
      } as never);

      const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States", market: "intl", paymentMethod: "WIRE_TRANSFER" });

      expect(result.shipping).toBe(0);
      expect(result.shippingToBeArranged).toBe(true);
    });

    it("uses the normal zone rate and leaves shippingToBeArranged false when nothing overrides it", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [gemCartItem({ gemstone: { id: "gem-1", name: "Blue Sapphire", stockStatus: "AVAILABLE", retailPrice: 100, lkrRetailPrice: 30000, costPrice: 60, shippingWeightTier: null, quoteShipping: false } })],
        pointsToRedeem: 0, discountCode: null,
      } as never);

      const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States", market: "intl", paymentMethod: "WIRE_TRANSFER" });

      expect(result.shipping).toBeCloseTo(3000 / 300);
      expect(result.shippingToBeArranged).toBe(false);
    });
  });

  describe("jewelry variants", () => {
    it("throws when the specific chosen variant is unavailable, even if the piece's own stockStatus says otherwise", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [jewelryCartItem({ jewelryVariantId: "variant-1", jewelryVariant: { id: "variant-1", label: "Size 7", retailPrice: null, lkrRetailPrice: null, costPrice: null, stockStatus: "SOLD" } })],
        pointsToRedeem: 0, discountCode: null,
      } as never);
      await expect(buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" })).rejects.toThrow(/no longer available/i);
    });

    it("uses the variant's own price override over the piece's base price, and labels the line with it", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [jewelryCartItem({ jewelryVariantId: "variant-1", jewelryVariant: { id: "variant-1", label: "18K, Size 9", retailPrice: 650, lkrRetailPrice: null, costPrice: null, stockStatus: "AVAILABLE" } })],
        pointsToRedeem: 0, discountCode: null,
      } as never);

      const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" });

      expect(result.subtotal).toBe(650);
      expect(result.items[0].label).toBe("Signet Ring — 18K, Size 9");
    });

    it("falls back to the piece's base price when the chosen variant has no override", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [jewelryCartItem({ jewelryVariantId: "variant-1", jewelryVariant: { id: "variant-1", label: "Size 7", retailPrice: null, lkrRetailPrice: null, costPrice: null, stockStatus: "AVAILABLE" } })],
        pointsToRedeem: 0, discountCode: null,
      } as never);

      const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" });

      expect(result.subtotal).toBe(500);
    });

    it("uses the variant's own cost override for the birthday-discount profit calc", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [jewelryCartItem({ jewelryVariantId: "variant-1", jewelryVariant: { id: "variant-1", label: "Size 7", retailPrice: null, lkrRetailPrice: null, costPrice: 450, stockStatus: "AVAILABLE" } })],
        pointsToRedeem: 0, discountCode: null,
      } as never);
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({ ...userFixture, dateOfBirth: new Date(new Date().getFullYear() - 30, new Date().getMonth(), 15) } as never);

      const result = await buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "United States" });

      // base price 500, variant costPrice override 450 -> profit 50, 10% = 5
      // (piece's own costPrice of 300 would have given a much bigger discount)
      expect(result.birthdayDiscount).toBeCloseTo(5);
    });

    it("throws on /lk when the chosen variant and the piece both have no rupee price", async () => {
      prismaMock.retailCart.findUnique.mockResolvedValue({
        items: [jewelryCartItem({
          jewelryVariantId: "variant-1",
          jewelry: { id: "jewelry-1", name: "Signet Ring", stockStatus: "AVAILABLE", retailPrice: 500, lkrRetailPrice: null, costPrice: 300 },
          jewelryVariant: { id: "variant-1", label: "Size 7", retailPrice: null, lkrRetailPrice: null, costPrice: null, stockStatus: "AVAILABLE" },
        })],
        pointsToRedeem: 0, discountCode: null,
      } as never);
      await expect(buildCheckoutBreakdown({ userId: "user-1", shippingCountry: "Sri Lanka", market: "lk" })).rejects.toThrow(/can't be bought online in rupees/i);
    });
  });
});
