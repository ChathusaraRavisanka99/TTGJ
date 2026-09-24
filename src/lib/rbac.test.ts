import { describe, it, expect, vi } from "vitest";
import { requireStaffArea, hasStaffArea, marketFilterFor, requireMarketAccess } from "@/lib/rbac";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

describe("requireStaffArea", () => {
  it("throws when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(requireStaffArea("orders")).rejects.toThrow("UNAUTHENTICATED");
  });

  it("throws for a plain CUSTOMER", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "CUSTOMER", staffPermissions: [] } } as never);
    await expect(requireStaffArea("orders")).rejects.toThrow("FORBIDDEN");
  });

  it("allows ADMIN for every area", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "ADMIN", staffPermissions: [] } } as never);
    await expect(requireStaffArea("catalog")).resolves.toMatchObject({ id: "u1" });
  });

  it("allows STAFF only for an area switched on for them", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "STAFF", staffMarketScope: "intl", staffPermissions: ["orders"] } } as never);
    await expect(requireStaffArea("orders")).resolves.toMatchObject({ id: "u1" });
    await expect(requireStaffArea("catalog")).rejects.toThrow("FORBIDDEN");
    await expect(requireStaffArea("reviews")).rejects.toThrow("FORBIDDEN");
  });

  it("gives a STAFF with no permissions no access at all", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "STAFF", staffMarketScope: "both", staffPermissions: [] } } as never);
    await expect(requireStaffArea("orders")).rejects.toThrow("FORBIDDEN");
  });
});

describe("hasStaffArea / marketFilterFor", () => {
  it("hasStaffArea mirrors the guard without throwing", () => {
    expect(hasStaffArea({ role: "ADMIN" }, "reviews")).toBe(true);
    expect(hasStaffArea({ role: "STAFF", staffPermissions: ["reviews"] }, "reviews")).toBe(true);
    expect(hasStaffArea({ role: "STAFF", staffPermissions: ["reviews"] }, "orders")).toBe(false);
    expect(hasStaffArea({ role: "CUSTOMER", staffPermissions: ["orders"] }, "orders")).toBe(false);
    expect(hasStaffArea(null, "orders")).toBe(false);
  });

  it("marketFilterFor restricts a single-market STAFF only", () => {
    expect(marketFilterFor({ role: "ADMIN", staffMarketScope: null })).toBeUndefined();
    expect(marketFilterFor({ role: "STAFF", staffMarketScope: "both" })).toBeUndefined();
    expect(marketFilterFor({ role: "STAFF", staffMarketScope: "lk" })).toBe("lk");
    expect(marketFilterFor({ role: "STAFF", staffMarketScope: "intl" })).toBe("intl");
  });
});

describe("requireMarketAccess", () => {
  it("always allows ADMIN, regardless of market", async () => {
    await expect(requireMarketAccess({ role: "ADMIN", staffMarketScope: null }, "lk")).resolves.toBeUndefined();
    await expect(requireMarketAccess({ role: "ADMIN", staffMarketScope: null }, "intl")).resolves.toBeUndefined();
  });

  it("allows STAFF scoped to 'both' on any market", async () => {
    await expect(requireMarketAccess({ role: "STAFF", staffMarketScope: "both" }, "lk")).resolves.toBeUndefined();
    await expect(requireMarketAccess({ role: "STAFF", staffMarketScope: "both" }, "intl")).resolves.toBeUndefined();
  });

  it("allows STAFF scoped to exactly the order's own market", async () => {
    await expect(requireMarketAccess({ role: "STAFF", staffMarketScope: "intl" }, "intl")).resolves.toBeUndefined();
  });

  it("rejects STAFF scoped to a different market", async () => {
    await expect(requireMarketAccess({ role: "STAFF", staffMarketScope: "intl" }, "lk")).rejects.toThrow("FORBIDDEN");
  });

  it("rejects a plain CUSTOMER outright", async () => {
    await expect(requireMarketAccess({ role: "CUSTOMER", staffMarketScope: null }, "intl")).rejects.toThrow("FORBIDDEN");
  });
});
