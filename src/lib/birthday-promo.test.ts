import { describe, it, expect } from "vitest";
import { isBirthdayEligible } from "@/lib/birthday-promo";

const NOW = new Date("2026-06-15T00:00:00Z"); // June

describe("isBirthdayEligible", () => {
  it("is false with no date of birth on file", () => {
    expect(isBirthdayEligible({ dateOfBirth: null, lastBirthdayDiscountAt: null }, NOW)).toBe(false);
  });

  it("is false outside the customer's birth month", () => {
    const user = { dateOfBirth: new Date("1990-03-10"), lastBirthdayDiscountAt: null };
    expect(isBirthdayEligible(user, NOW)).toBe(false);
  });

  it("is true any day within the birth month, regardless of birth year", () => {
    const user = { dateOfBirth: new Date("1990-06-01"), lastBirthdayDiscountAt: null };
    expect(isBirthdayEligible(user, NOW)).toBe(true);
    expect(isBirthdayEligible(user, new Date("2026-06-30T23:59:59Z"))).toBe(true);
  });

  it("is false if already redeemed this calendar year", () => {
    const user = { dateOfBirth: new Date("1990-06-01"), lastBirthdayDiscountAt: new Date("2026-06-02") };
    expect(isBirthdayEligible(user, NOW)).toBe(false);
  });

  it("is true again once a new calendar year starts", () => {
    const user = { dateOfBirth: new Date("1990-06-01"), lastBirthdayDiscountAt: new Date("2025-06-02") };
    expect(isBirthdayEligible(user, NOW)).toBe(true);
  });
});
