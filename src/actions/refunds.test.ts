import { describe, it, expect, vi } from "vitest";
import { requestRefundAction, resolveRefundRequestAction, denyRefundRequestAction } from "@/actions/refunds";
import { requestRefund, resolveRefundRequest, denyRefundRequest } from "@/lib/refunds";

vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }) }));
vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));
vi.mock("@/lib/refunds", () => ({
  requestRefund: vi.fn(),
  resolveRefundRequest: vi.fn(),
  denyRefundRequest: vi.fn(),
}));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("requestRefundAction", () => {
  it("rejects an invalid reason before calling requestRefund", async () => {
    const result = await requestRefundAction("order-1", formData({ reason: "NOT_A_REAL_REASON" }));
    expect(result.ok).toBe(false);
    expect(requestRefund).not.toHaveBeenCalled();
  });

  it("passes the parsed reason/notes through to requestRefund", async () => {
    vi.mocked(requestRefund).mockResolvedValue({ ok: true });
    const result = await requestRefundAction("order-1", formData({ reason: "DAMAGED", reasonNotes: "Box was crushed" }));
    expect(result).toEqual({ ok: true });
    expect(requestRefund).toHaveBeenCalledWith("order-1", "user-1", { reason: "DAMAGED", reasonNotes: "Box was crushed" });
  });
});

describe("resolveRefundRequestAction", () => {
  it("rejects an invalid resolution before calling resolveRefundRequest", async () => {
    const result = await resolveRefundRequestAction("refund-1", "order-1", formData({ resolution: "NOT_REAL" }));
    expect(result.ok).toBe(false);
    expect(resolveRefundRequest).not.toHaveBeenCalled();
  });

  it("passes resolution/amount/restock/notes through", async () => {
    vi.mocked(resolveRefundRequest).mockResolvedValue({ ok: true });
    const result = await resolveRefundRequestAction(
      "refund-1", "order-1",
      formData({ resolution: "PARTIAL", customAmount: "200", restock: "true", adminNotes: "Agreed with customer" }),
    );
    expect(result).toEqual({ ok: true });
    expect(resolveRefundRequest).toHaveBeenCalledWith("refund-1", {
      resolution: "PARTIAL", customAmount: 200, restock: true, adminNotes: "Agreed with customer",
    });
  });

  it("reads a checked restock checkbox correctly against its hidden-false fallback field (real browser form submission)", async () => {
    // The actual DOM order (RefundResolutionPanel.tsx): a hidden "false"
    // input, then the checkbox itself — a checked box submits both
    // under the same name, "false" first. Regression test for a real
    // bug: reading via formData.get("restock") returned the hidden
    // field's "false" (the first of the two), not the checked box's
    // "true", so restock silently never took effect.
    vi.mocked(resolveRefundRequest).mockResolvedValue({ ok: true });
    const fd = new FormData();
    fd.set("resolution", "FULL");
    fd.set("adminNotes", "");
    fd.append("restock", "false");
    fd.append("restock", "true");

    await resolveRefundRequestAction("refund-1", "order-1", fd);

    expect(resolveRefundRequest).toHaveBeenCalledWith("refund-1", expect.objectContaining({ restock: true }));
  });

  it("defaults restock to false when the checkbox isn't submitted", async () => {
    vi.mocked(resolveRefundRequest).mockResolvedValue({ ok: true });
    await resolveRefundRequestAction("refund-1", "order-1", formData({ resolution: "FULL" }));
    expect(resolveRefundRequest).toHaveBeenCalledWith("refund-1", expect.objectContaining({ restock: false }));
  });
});

describe("denyRefundRequestAction", () => {
  it("passes the admin notes through to denyRefundRequest", async () => {
    vi.mocked(denyRefundRequest).mockResolvedValue({ ok: true });
    const result = await denyRefundRequestAction("refund-1", "order-1", "Outside return window");
    expect(result).toEqual({ ok: true });
    expect(denyRefundRequest).toHaveBeenCalledWith("refund-1", "Outside return window");
  });
});
