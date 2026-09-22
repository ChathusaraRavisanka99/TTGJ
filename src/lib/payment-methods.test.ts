import { describe, it, expect } from "vitest";
import { paymentMethodsFor, isPaymentMethodLive, defaultPaymentMethod } from "@/lib/payment-methods";

describe("paymentMethodsFor", () => {
  it("offers only PayHere card, live, on the international site", () => {
    expect(paymentMethodsFor("intl")).toEqual([{ key: "PAYHERE_CARD", status: "live" }]);
  });

  it("offers wire live and card/COD as coming soon on the Sri Lanka store", () => {
    const methods = paymentMethodsFor("lk");
    expect(methods.find((m) => m.key === "WIRE_TRANSFER")?.status).toBe("live");
    expect(methods.find((m) => m.key === "PAYHERE_CARD")?.status).toBe("coming_soon");
    expect(methods.find((m) => m.key === "COD")?.status).toBe("coming_soon");
  });
});

describe("isPaymentMethodLive", () => {
  it("accepts PayHere card internationally", () => {
    expect(isPaymentMethodLive("intl", "PAYHERE_CARD")).toBe(true);
  });

  it("rejects wire transfer internationally (not offered there at all)", () => {
    expect(isPaymentMethodLive("intl", "WIRE_TRANSFER")).toBe(false);
  });

  it("accepts wire transfer on /lk", () => {
    expect(isPaymentMethodLive("lk", "WIRE_TRANSFER")).toBe(true);
  });

  it("rejects a not-yet-live method on /lk (card is listed but disabled)", () => {
    expect(isPaymentMethodLive("lk", "PAYHERE_CARD")).toBe(false);
  });

  it("rejects an unknown key", () => {
    expect(isPaymentMethodLive("lk", "BITCOIN")).toBe(false);
  });
});

describe("defaultPaymentMethod", () => {
  it("defaults to PayHere card internationally", () => {
    expect(defaultPaymentMethod("intl")).toBe("PAYHERE_CARD");
  });

  it("defaults to wire transfer on /lk (the only live method there)", () => {
    expect(defaultPaymentMethod("lk")).toBe("WIRE_TRANSFER");
  });
});
