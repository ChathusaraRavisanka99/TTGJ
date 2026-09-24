import { describe, it, expect } from "vitest";
import { staffAreaForPath, staffCanAccessPath, firstStaffPath, parseStaffPermissions, staffNavLinks } from "@/lib/staff-permissions";

describe("staffAreaForPath", () => {
  it("maps each area's pages, including nested ones", () => {
    expect(staffAreaForPath("/admin/orders")).toBe("orders");
    expect(staffAreaForPath("/admin/orders/abc")).toBe("orders");
    expect(staffAreaForPath("/admin/gems/new")).toBe("catalog");
    expect(staffAreaForPath("/admin/jewelry/abc")).toBe("catalog");
    expect(staffAreaForPath("/admin/quotes/abc")).toBe("requests");
    expect(staffAreaForPath("/admin/support/user-1")).toBe("requests");
    expect(staffAreaForPath("/admin/reviews")).toBe("reviews");
    expect(staffAreaForPath("/admin/content/home")).toBe("content");
    expect(staffAreaForPath("/admin/content/about")).toBe("content");
  });

  it("never maps an admin-only page", () => {
    for (const p of ["/admin", "/admin/customers", "/admin/discount-codes", "/admin/staff", "/admin/analytics", "/admin/media", "/admin/commerce-settings", "/admin/promotions", "/admin/alt-collections", "/admin/loyalty-settings"]) {
      expect(staffAreaForPath(p)).toBeNull();
    }
  });

  it("keeps the manual-sale and build-order sub-pages admin-only", () => {
    expect(staffAreaForPath("/admin/orders/manual/new")).toBeNull();
    expect(staffAreaForPath("/admin/sourcing/abc/build-order")).toBeNull();
  });

  it("doesn't confuse look-alike prefixes", () => {
    expect(staffAreaForPath("/admin/gemstones-extra")).toBeNull();
    expect(staffAreaForPath("/admin/ordersx")).toBeNull();
  });
});

describe("staffCanAccessPath / firstStaffPath / nav", () => {
  it("only allows paths of enabled areas", () => {
    expect(staffCanAccessPath(["catalog"], "/admin/gems")).toBe(true);
    expect(staffCanAccessPath(["catalog"], "/admin/orders")).toBe(false);
    expect(staffCanAccessPath([], "/admin/orders")).toBe(false);
  });

  it("picks the first enabled area's landing page", () => {
    expect(firstStaffPath(["reviews", "catalog"])).toBe("/admin/gems");
    expect(firstStaffPath(["orders"])).toBe("/admin/orders");
    expect(firstStaffPath([])).toBeNull();
  });

  it("builds nav links only for enabled areas", () => {
    expect(staffNavLinks(["reviews"]).map((l) => l.href)).toEqual(["/admin/reviews"]);
    expect(staffNavLinks(["catalog", "requests"]).map((l) => l.href)).toEqual(["/admin/gems", "/admin/jewelry", "/admin/messages", "/admin/quotes", "/admin/sourcing"]);
  });

  it("parseStaffPermissions drops unknown values", () => {
    expect(parseStaffPermissions(["orders", "everything", "catalog"])).toEqual(["orders", "catalog"]);
    expect(parseStaffPermissions(null)).toEqual([]);
  });
});
