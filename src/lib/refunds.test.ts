import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { requestRefund, resolveRefundRequest, denyRefundRequest, isRefundEligible } from "@/lib/refunds";

describe("isRefundEligible", () => {
  it.each(["PAID", "SHIPPED", "DELIVERED"])("treats %s as eligible", (status) => {
    expect(isRefundEligible({ status })).toBe(true);
  });

  it.each(["PENDING_PAYMENT", "PAYMENT_FAILED", "CANCELLED"])("treats %s as not eligible", (status) => {
    expect(isRefundEligible({ status })).toBe(false);
  });
});

describe("requestRefund", () => {
  it("refuses when the order doesn't belong to this user", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ userId: "someone-else", status: "PAID" } as never);
    const result = await requestRefund("order-1", "user-1", { reason: "DAMAGED" });
    expect(result).toEqual({ ok: false, error: "Order not found." });
    expect(prismaMock.refundRequest.create).not.toHaveBeenCalled();
  });

  it("refuses an ineligible order (e.g. still unpaid)", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ userId: "user-1", status: "PENDING_PAYMENT" } as never);
    const result = await requestRefund("order-1", "user-1", { reason: "DAMAGED" });
    expect(result).toEqual({ ok: false, error: "This order isn't eligible for a refund request." });
  });

  it("refuses a second request on the same order", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ userId: "user-1", status: "PAID" } as never);
    prismaMock.refundRequest.findUnique.mockResolvedValue({ id: "existing" } as never);
    const result = await requestRefund("order-1", "user-1", { reason: "DAMAGED" });
    expect(result).toEqual({ ok: false, error: "A refund request already exists for this order." });
  });

  it("records the request with its reason and notes", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ userId: "user-1", status: "DELIVERED" } as never);
    prismaMock.refundRequest.findUnique.mockResolvedValue(null);
    prismaMock.refundRequest.create.mockResolvedValue({} as never);

    const result = await requestRefund("order-1", "user-1", { reason: "NOT_AS_DESCRIBED", reasonNotes: "Colour looked different in photos" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.refundRequest.create).toHaveBeenCalledWith({
      data: { orderId: "order-1", userId: "user-1", reason: "NOT_AS_DESCRIBED", reasonNotes: "Colour looked different in photos" },
    });
  });
});

const baseRefund = {
  id: "refund-1",
  orderId: "order-1",
  userId: "user-1",
  status: "REQUESTED",
  order: {
    id: "order-1",
    orderNumber: "ORD-2026-0001",
    total: 1000,
    shippingAmount: 50,
    currency: "USD",
    items: [{ gemstoneId: "gem-1", jewelryId: null, jewelryVariantId: null }],
  },
};

describe("resolveRefundRequest", () => {
  beforeEach(() => {
    prismaMock.refundRequest.update.mockResolvedValue({} as never);
    prismaMock.notification.create.mockResolvedValue({} as never);
  });

  it("refuses when the request doesn't exist", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(null);
    const result = await resolveRefundRequest("refund-1", { resolution: "FULL", restock: false });
    expect(result).toEqual({ ok: false, error: "Refund request not found." });
  });

  it("refuses a request that's already been resolved", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue({ ...baseRefund, status: "REFUNDED" } as never);
    const result = await resolveRefundRequest("refund-1", { resolution: "FULL", restock: false });
    expect(result).toEqual({ ok: false, error: "This request has already been resolved." });
  });

  it("computes a FULL refund as the order's own total", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(baseRefund as never);
    const result = await resolveRefundRequest("refund-1", { resolution: "FULL", restock: false });
    expect(result).toEqual({ ok: true });
    expect(prismaMock.refundRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REFUNDED", refundAmount: 1000, resolution: "FULL" }) }),
    );
  });

  it("computes a MINUS_SHIPPING refund as total minus shipping", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(baseRefund as never);
    await resolveRefundRequest("refund-1", { resolution: "MINUS_SHIPPING", restock: false });
    expect(prismaMock.refundRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ refundAmount: 950 }) }),
    );
  });

  it("requires a positive amount for a PARTIAL refund", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(baseRefund as never);
    const result = await resolveRefundRequest("refund-1", { resolution: "PARTIAL", restock: false });
    expect(result).toEqual({ ok: false, error: "Enter a partial refund amount." });
    expect(prismaMock.refundRequest.update).not.toHaveBeenCalled();
  });

  it("caps a PARTIAL refund at the order's own total", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(baseRefund as never);
    await resolveRefundRequest("refund-1", { resolution: "PARTIAL", customAmount: 5000, restock: false });
    expect(prismaMock.refundRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ refundAmount: 1000 }) }),
    );
  });

  it("releases the item back to AVAILABLE only when restock is requested", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(baseRefund as never);
    prismaMock.gemstone.updateMany.mockResolvedValue({ count: 1 });

    await resolveRefundRequest("refund-1", { resolution: "FULL", restock: true });

    expect(prismaMock.gemstone.updateMany).toHaveBeenCalledWith({ where: { id: { in: ["gem-1"] } }, data: { stockStatus: "AVAILABLE" } });
  });

  it("does not touch stock when restock is false", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(baseRefund as never);
    await resolveRefundRequest("refund-1", { resolution: "FULL", restock: false });
    expect(prismaMock.gemstone.updateMany).not.toHaveBeenCalled();
  });

  it("notifies the customer with the refunded amount", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(baseRefund as never);
    await resolveRefundRequest("refund-1", { resolution: "FULL", restock: false });
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-1", requestType: "order", requestId: "order-1" }) }),
    );
  });
});

describe("denyRefundRequest", () => {
  it("refuses when the request doesn't exist", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(null);
    const result = await denyRefundRequest("refund-1");
    expect(result).toEqual({ ok: false, error: "Refund request not found." });
  });

  it("refuses a request that's already been resolved", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue({ ...baseRefund, status: "DENIED" } as never);
    const result = await denyRefundRequest("refund-1");
    expect(result).toEqual({ ok: false, error: "This request has already been resolved." });
  });

  it("marks the request DENIED and notifies the customer", async () => {
    prismaMock.refundRequest.findUnique.mockResolvedValue(baseRefund as never);
    prismaMock.refundRequest.update.mockResolvedValue({} as never);
    prismaMock.notification.create.mockResolvedValue({} as never);

    const result = await denyRefundRequest("refund-1", "Outside return window");

    expect(result).toEqual({ ok: true });
    expect(prismaMock.refundRequest.update).toHaveBeenCalledWith({
      where: { id: "refund-1" },
      data: { status: "DENIED", adminNotes: "Outside return window", resolvedAt: expect.any(Date) },
    });
    expect(prismaMock.notification.create).toHaveBeenCalledOnce();
  });
});
