import { describe, it, expect } from "vitest";
import { registerSchema } from "@/lib/validation/auth";

const validRetail = { name: "Jane Doe", email: "jane@example.com", password: "password123", customerType: "RETAIL" as const };

describe("registerSchema", () => {
  it("accepts a valid retail registration", () => {
    expect(registerSchema.safeParse(validRetail).success).toBe(true);
  });

  it("rejects a name that's too short", () => {
    const result = registerSchema.safeParse({ ...validRetail, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...validRetail, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    const result = registerSchema.safeParse({ ...validRetail, password: "short" });
    expect(result.success).toBe(false);
  });

  it("defaults customerType to RETAIL when omitted", () => {
    const { customerType, ...withoutType } = validRetail;
    void customerType;
    const result = registerSchema.safeParse(withoutType);
    expect(result.success && result.data.customerType).toBe("RETAIL");
  });

  it("requires businessName and businessRegNo for a wholesale registration", () => {
    const result = registerSchema.safeParse({ ...validRetail, customerType: "WHOLESALE" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("businessName");
      expect(paths).toContain("businessRegNo");
    }
  });

  it("accepts a wholesale registration with business details filled in", () => {
    const result = registerSchema.safeParse({
      ...validRetail,
      customerType: "WHOLESALE",
      businessName: "Acme Gems Pte Ltd",
      businessRegNo: "REG12345",
    });
    expect(result.success).toBe(true);
  });

  it("does not require business details for a retail registration", () => {
    expect(registerSchema.safeParse(validRetail).success).toBe(true);
  });
});
