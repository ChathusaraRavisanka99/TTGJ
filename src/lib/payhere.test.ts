import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHash } from "crypto";
import { verifyPayhereNotification, generateCheckoutHash, payhereCheckoutUrl } from "@/lib/payhere";

function md5Upper(input: string): string {
  return createHash("md5").update(input).digest("hex").toUpperCase();
}

const MERCHANT_ID = "test-merchant";
const MERCHANT_SECRET = "test-secret";

function signNotification(input: { orderId: string; amount: string; currency: string; statusCode: string }): string {
  return md5Upper(`${MERCHANT_ID}${input.orderId}${input.amount}${input.currency}${input.statusCode}${md5Upper(MERCHANT_SECRET)}`);
}

describe("payhere", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PAYHERE_MERCHANT_ID = MERCHANT_ID;
    process.env.PAYHERE_MERCHANT_SECRET = MERCHANT_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("verifyPayhereNotification — the single most security-relevant function in the app", () => {
    const base = { orderId: "ORD-2026-0001", amount: "1000.00", currency: "USD", statusCode: "2" };

    it("accepts a correctly-signed notification", () => {
      const md5sig = signNotification(base);
      expect(
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: base.orderId, payhereAmount: base.amount, payhereCurrency: base.currency, statusCode: base.statusCode, md5sig }),
      ).toBe(true);
    });

    it("accepts a lowercase md5sig (case-insensitive comparison)", () => {
      const md5sig = signNotification(base).toLowerCase();
      expect(
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: base.orderId, payhereAmount: base.amount, payhereCurrency: base.currency, statusCode: base.statusCode, md5sig }),
      ).toBe(true);
    });

    it("rejects a tampered amount — an attacker changing the charge amount invalidates the signature", () => {
      const md5sig = signNotification(base); // signed for 1000.00
      expect(
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: base.orderId, payhereAmount: "1.00", payhereCurrency: base.currency, statusCode: base.statusCode, md5sig }),
      ).toBe(false);
    });

    it("rejects a tampered orderId", () => {
      const md5sig = signNotification(base);
      expect(
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: "ORD-2026-9999", payhereAmount: base.amount, payhereCurrency: base.currency, statusCode: base.statusCode, md5sig }),
      ).toBe(false);
    });

    it("rejects a tampered currency", () => {
      const md5sig = signNotification(base);
      expect(
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: base.orderId, payhereAmount: base.amount, payhereCurrency: "LKR", statusCode: base.statusCode, md5sig }),
      ).toBe(false);
    });

    it("rejects a tampered statusCode — can't forge a 'success' from a different original status", () => {
      const md5sig = signNotification({ ...base, statusCode: "0" }); // signed as PENDING
      expect(
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: base.orderId, payhereAmount: base.amount, payhereCurrency: base.currency, statusCode: "2", md5sig }),
      ).toBe(false);
    });

    it("rejects a completely fabricated signature", () => {
      expect(
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: base.orderId, payhereAmount: base.amount, payhereCurrency: base.currency, statusCode: base.statusCode, md5sig: "0".repeat(32) }),
      ).toBe(false);
    });

    it("rejects a wrong-length md5sig instead of throwing", () => {
      expect(
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: base.orderId, payhereAmount: base.amount, payhereCurrency: base.currency, statusCode: base.statusCode, md5sig: "short" }),
      ).toBe(false);
    });

    it("throws a clear configuration error when the merchant secret isn't set, rather than silently misbehaving", () => {
      delete process.env.PAYHERE_MERCHANT_SECRET;
      expect(() =>
        verifyPayhereNotification({ merchantId: MERCHANT_ID, orderId: base.orderId, payhereAmount: base.amount, payhereCurrency: base.currency, statusCode: base.statusCode, md5sig: "x" }),
      ).toThrow(/PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET/);
    });
  });

  describe("generateCheckoutHash", () => {
    it("formats the amount to exactly 2 decimal places regardless of input precision", () => {
      const a = generateCheckoutHash("ORD-2026-0001", 1000, "USD");
      const b = generateCheckoutHash("ORD-2026-0001", 1000.0, "USD");
      expect(a).toBe(b);
    });

    it("produces a different hash for a different amount", () => {
      const a = generateCheckoutHash("ORD-2026-0001", 1000, "USD");
      const b = generateCheckoutHash("ORD-2026-0001", 1000.01, "USD");
      expect(a).not.toBe(b);
    });
  });

  describe("payhereCheckoutUrl", () => {
    it("defaults to the sandbox endpoint (opt-in to live, never the reverse)", () => {
      delete process.env.PAYHERE_MODE;
      expect(payhereCheckoutUrl()).toContain("sandbox.payhere.lk");
    });

    it("only switches to the live endpoint when PAYHERE_MODE is exactly 'live'", () => {
      process.env.PAYHERE_MODE = "live";
      expect(payhereCheckoutUrl()).toBe("https://www.payhere.lk/pay/checkout");
      process.env.PAYHERE_MODE = "production"; // a plausible typo — must NOT go live
      expect(payhereCheckoutUrl()).toContain("sandbox.payhere.lk");
    });
  });
});
