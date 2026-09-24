import { describe, it, expect, vi } from "vitest";
import { requireStaffOrAdmin, requireOrderMarketAccess } from "@/lib/rbac";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

describe("requireStaffOrAdmin", () => {
  it("throws when there's no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(requireStaffOrAdmin()).rejects.toThrow("UNAUTHENTICATED");
  });

  it("throws for a plain CUSTOMER", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "CUSTOMER" } } as never);
    await expect(requireStaffOrAdmin()).rejects.toThrow("FORBIDDEN");
  });

  it("allows ADMIN", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "ADMIN" } } as never);
    await expect(requireStaffOrAdmin()).resolves.toEqual({ id: "u1", role: "ADMIN" });
  });

  it("allows STAFF", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "STAFF", staffMarketScope: "intl" } } as never);
    await expect(requireStaffOrAdmin()).resolves.toEqual({ id: "u1", role: "STAFF", staffMarketScope: "intl" });
  });
});

describe("requireOrderMarketAccess", () => {
  it("always allows ADMIN, regardless of market", async () => {
    await expect(requireOrderMarketAccess({ role: "ADMIN", staffMarketScope: null }, "lk")).resolves.toBeUndefined();
    await expect(requireOrderMarketAccess({ role: "ADMIN", staffMarketScope: null }, "intl")).resolves.toBeUndefined();
  });

  it("allows STAFF scoped to 'both' on any market", async () => {
    await expect(requireOrderMarketAccess({ role: "STAFF", staffMarketScope: "both" }, "lk")).resolves.toBeUndefined();
    await expect(requireOrderMarketAccess({ role: "STAFF", staffMarketScope: "both" }, "intl")).resolves.toBeUndefined();
  });

  it("allows STAFF scoped to exactly the order's own market", async () => {
    await expect(requireOrderMarketAccess({ role: "STAFF", staffMarketScope: "intl" }, "intl")).resolves.toBeUndefined();
  });

  it("rejects STAFF scoped to a different market", async () => {
    await expect(requireOrderMarketAccess({ role: "STAFF", staffMarketScope: "intl" }, "lk")).rejects.toThrow("FORBIDDEN");
  });

  it("rejects a plain CUSTOMER outright", async () => {
    await expect(requireOrderMarketAccess({ role: "CUSTOMER", staffMarketScope: null }, "intl")).rejects.toThrow("FORBIDDEN");
  });
});
