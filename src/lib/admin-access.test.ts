import { describe, it, expect } from "vitest";
import { hasAdminPortalAccess } from "@/lib/admin-access";

describe("hasAdminPortalAccess", () => {
  it("is true for an admin", () => {
    expect(hasAdminPortalAccess({ role: "ADMIN" })).toBe(true);
  });

  it("is true for staff with at least one area, false with none", () => {
    expect(hasAdminPortalAccess({ role: "STAFF", staffPermissions: ["reviews"] })).toBe(true);
    expect(hasAdminPortalAccess({ role: "STAFF", staffPermissions: [] })).toBe(false);
    expect(hasAdminPortalAccess({ role: "STAFF" })).toBe(false);
  });

  it("is false for a customer, even one carrying leftover permissions, and for no user", () => {
    expect(hasAdminPortalAccess({ role: "CUSTOMER", staffPermissions: ["orders"] })).toBe(false);
    expect(hasAdminPortalAccess(null)).toBe(false);
  });
});
