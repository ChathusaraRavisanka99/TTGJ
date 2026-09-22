import { describe, it, expect, vi } from "vitest";
import { markOrderShippedByAdmin, markOrderDeliveredByAdmin } from "@/actions/orders";
import { markOrderShipped, markOrderDelivered } from "@/lib/orders";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));
// src/actions/orders.ts also imports `auth` from "@/lib/auth" (used by
// cancelMyWireOrder, not the functions under test here) — mocked so this
// file never pulls in the real NextAuth config/providers.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, markOrderShipped: vi.fn(), markOrderDelivered: vi.fn() };
});

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("markOrderShippedByAdmin", () => {
  it("rejects a missing carrier or tracking number before calling the lifecycle function", async () => {
    const result = await markOrderShippedByAdmin("order-1", formData({ carrier: "", trackingNumber: "" }));
    expect(result.ok).toBe(false);
    expect(markOrderShipped).not.toHaveBeenCalled();
  });

  it("rejects an invalid tracking URL", async () => {
    const result = await markOrderShippedByAdmin("order-1", formData({ carrier: "DHL", trackingNumber: "123", trackingUrl: "not-a-url" }));
    expect(result.ok).toBe(false);
    expect(markOrderShipped).not.toHaveBeenCalled();
  });

  it("calls markOrderShipped with the validated fields and succeeds", async () => {
    vi.mocked(markOrderShipped).mockResolvedValue({ ok: true });
    const result = await markOrderShippedByAdmin("order-1", formData({ carrier: "DHL Express", trackingNumber: "1Z999" }));
    expect(result).toEqual({ ok: true });
    expect(markOrderShipped).toHaveBeenCalledWith("order-1", { carrier: "DHL Express", trackingNumber: "1Z999", trackingUrl: undefined });
  });

  it("surfaces the lifecycle function's own error (e.g. order not PAID)", async () => {
    vi.mocked(markOrderShipped).mockResolvedValue({ ok: false, error: "Only a paid order can be marked shipped." });
    const result = await markOrderShippedByAdmin("order-1", formData({ carrier: "DHL", trackingNumber: "1Z999" }));
    expect(result).toEqual({ ok: false, error: "Only a paid order can be marked shipped." });
  });
});

describe("markOrderDeliveredByAdmin", () => {
  it("calls markOrderDelivered with source: admin", async () => {
    vi.mocked(markOrderDelivered).mockResolvedValue({ ok: true });
    const result = await markOrderDeliveredByAdmin("order-1");
    expect(result).toEqual({ ok: true });
    expect(markOrderDelivered).toHaveBeenCalledWith("order-1", { source: "admin" });
  });

  it("returns a clean error when the order isn't shipped yet", async () => {
    vi.mocked(markOrderDelivered).mockResolvedValue({ ok: false });
    const result = await markOrderDeliveredByAdmin("order-1");
    expect(result).toEqual({ ok: false, error: "This order isn't marked shipped yet." });
  });
});
