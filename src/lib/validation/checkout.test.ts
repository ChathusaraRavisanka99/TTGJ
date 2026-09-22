import { describe, it, expect } from "vitest";
import { shippingSchema } from "@/lib/validation/checkout";

const valid = { firstName: "Jane", lastName: "Doe", phone: "+1 555 0100", address: "1 Test St", city: "Springfield", country: "United States" };

describe("shippingSchema", () => {
  it("accepts a fully filled-in shipping form", () => {
    expect(shippingSchema.safeParse(valid).success).toBe(true);
  });

  it.each(["firstName", "lastName", "phone", "address", "city", "country"] as const)(
    "rejects a missing %s",
    (field) => {
      const result = shippingSchema.safeParse({ ...valid, [field]: "" });
      expect(result.success).toBe(false);
    },
  );

  it("rejects an address well beyond a reasonable length", () => {
    const result = shippingSchema.safeParse({ ...valid, address: "x".repeat(500) });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number well beyond a reasonable length", () => {
    const result = shippingSchema.safeParse({ ...valid, phone: "1".repeat(100) });
    expect(result.success).toBe(false);
  });
});
