import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { finalizePaidOrder, cancelPendingOrder, markOrderShipped, markOrderDelivered } from "@/lib/orders";
import { sendEmail } from "@/lib/email";
import { registerTracking } from "@/lib/track17";

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/track17", () => ({ registerTracking: vi.fn() }));

const baseOrder = {
  id: "order-1",
  orderNumber: "ORD-2026-0001",
  userId: "user-1",
  market: "intl",
  currency: "USD",
  subtotal: 100,
  total: 100,
  discountCodeId: null as string | null,
  birthdayDiscountAmount: 0,
  pointsRedeemed: 0,
  status: "PENDING_PAYMENT",
  items: [] as { gemstoneId: string | null; jewelryId: string | null; label?: string; quantity?: number; lineTotal?: number }[],
  user: { email: "customer@example.com" },
};

function mockCommonDependencies() {
  prismaMock.loyaltySettings.findUnique.mockResolvedValue({
    id: "singleton", pointsPerCurrencyUnit: 1, pointsRedemptionValue: 0.01, minRedeemPoints: 500,
    maxRedeemPercentOfOrder: 50, referralMinOrderValue: 50, referralReferrerBonusPoints: 500,
    referralRefereeBonusPoints: 250, updatedAt: new Date(),
  } as never);
  prismaMock.commerceSettings.findUnique.mockResolvedValue({
    id: "singleton", vatPercent: 18, applyVatToInternational: false, gatewayCommissionPercent: 3.5,
    handlingFeeMarginPercent: 1, birthdayDiscountPercent: 10, usdToLkrRate: 300, updatedAt: new Date(),
  } as never);
  prismaMock.referral.findUnique.mockResolvedValue(null); // no referral to settle, by default
  prismaMock.retailCart.findUnique.mockResolvedValue(null); // no cart to clear, by default
  prismaMock.notification.create.mockResolvedValue({} as never);
  prismaMock.order.update.mockResolvedValue({} as never);
  prismaMock.user.update.mockResolvedValue({} as never);
  vi.mocked(sendEmail).mockResolvedValue({ ok: true });
}

describe("finalizePaidOrder", () => {
  beforeEach(() => {
    mockCommonDependencies();
  });

  it("is idempotent — an already-PAID order is a pure no-op, never re-runs any side effect", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PAID" } as never);

    const result = await finalizePaidOrder("order-1");

    expect(result).toEqual({ alreadyPaid: true });
    expect(prismaMock.order.update).not.toHaveBeenCalled();
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });

  it("marks the order PAID with a paidAt timestamp and the gateway payment id", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder } as never);

    await finalizePaidOrder("order-1", { gatewayPaymentId: "pay_123" });

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { status: "PAID", paidAt: expect.any(Date), gatewayPaymentId: "pay_123" },
    });
  });

  it("flips only the gemstone/jewelry items actually on the order to SOLD", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({
      ...baseOrder,
      items: [{ gemstoneId: "gem-1", jewelryId: null }, { gemstoneId: null, jewelryId: "jew-1" }],
    } as never);

    await finalizePaidOrder("order-1");

    expect(prismaMock.gemstone.updateMany).toHaveBeenCalledWith({ where: { id: { in: ["gem-1"] } }, data: { stockStatus: "SOLD" } });
    expect(prismaMock.jewelryPiece.updateMany).toHaveBeenCalledWith({ where: { id: { in: ["jew-1"] } }, data: { stockStatus: "SOLD" } });
  });

  it("skips the stock-flip calls entirely when the order has no items of that kind", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder } as never); // items: []

    await finalizePaidOrder("order-1");

    expect(prismaMock.gemstone.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.jewelryPiece.updateMany).not.toHaveBeenCalled();
  });

  it("finalizes a discount code redemption when one was applied at checkout", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, discountCodeId: "code-1" } as never);
    prismaMock.discountCode.findUnique.mockResolvedValue({ id: "code-1", active: true, expiresAt: null, scope: "PUBLIC", assignedUserId: null, maxUses: null, usesCount: 0 } as never);
    prismaMock.discountCode.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.discountCodeRedemption.create.mockResolvedValue({} as never);

    await finalizePaidOrder("order-1");

    expect(prismaMock.discountCodeRedemption.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ discountCodeId: "code-1", orderId: "order-1" }) }),
    );
  });

  it("doesn't fail the whole finalization if the discount code can no longer be redeemed (best-effort)", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, discountCodeId: "code-1" } as never);
    prismaMock.discountCode.findUnique.mockResolvedValue(null); // code vanished between checkout and payment
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await finalizePaidOrder("order-1");

    expect(result).toEqual({ alreadyPaid: false });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("stamps lastBirthdayDiscountAt only when a birthday discount was actually applied to this order", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, birthdayDiscountAmount: 20 } as never);

    await finalizePaidOrder("order-1");

    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { lastBirthdayDiscountAt: expect.any(Date) } });
  });

  it("does not stamp lastBirthdayDiscountAt when no birthday discount was applied", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, birthdayDiscountAmount: 0 } as never);

    await finalizePaidOrder("order-1");

    expect(prismaMock.user.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: { lastBirthdayDiscountAt: expect.any(Date) } }));
  });

  it("earns rewards points on the order's subtotal", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, subtotal: 80 } as never);

    await finalizePaidOrder("order-1");

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" }, data: expect.objectContaining({ pointsBalance: { increment: 80 } }) }),
    );
  });

  it("clears the retail cart's items, discount code, and staged points when a cart exists for this order's market", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder } as never);
    prismaMock.retailCart.findUnique.mockResolvedValue({ id: "cart-1" } as never);
    prismaMock.retailCartItem.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.retailCart.update.mockResolvedValue({} as never);

    await finalizePaidOrder("order-1");

    expect(prismaMock.retailCart.findUnique).toHaveBeenCalledWith({ where: { userId_market: { userId: "user-1", market: "intl" } } });
    expect(prismaMock.retailCartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: "cart-1" } });
    expect(prismaMock.retailCart.update).toHaveBeenCalledWith({ where: { id: "cart-1" }, data: { discountCodeId: null, pointsToRedeem: 0 } });
  });

  it("skips cart-clearing entirely when the customer has no cart for that market", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder } as never);
    // retailCart.findUnique already resolves null via mockCommonDependencies

    await finalizePaidOrder("order-1");

    expect(prismaMock.retailCartItem.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.retailCart.update).not.toHaveBeenCalled();
  });

  it("always notifies the customer that payment was received", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder } as never);

    await finalizePaidOrder("order-1");

    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-1", requestType: "order", requestId: "order-1" }) }),
    );
  });

  it("sends an order confirmation email to the customer's address with their items", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({
      ...baseOrder,
      items: [{ gemstoneId: "gem-1", jewelryId: null, label: "Blue Sapphire", quantity: 1, lineTotal: 100 }],
    } as never);

    await finalizePaidOrder("order-1");

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "customer@example.com", subject: expect.stringContaining("ORD-2026-0001") }),
    );
  });

  it("does not fail the whole finalization when the confirmation email can't be sent", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder } as never);
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, error: "not configured" });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await finalizePaidOrder("order-1");

    expect(result).toEqual({ alreadyPaid: false });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("cancelPendingOrder", () => {
  it("no-ops for an order that isn't PENDING_PAYMENT — never resurrects a sold or already-cancelled order", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PAID", items: [] } as never);

    const result = await cancelPendingOrder("order-1");

    expect(result).toEqual({ cancelled: false });
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it("cancels a pending order and releases only its RESERVED items back to AVAILABLE", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({
      ...baseOrder, status: "PENDING_PAYMENT", items: [{ gemstoneId: "gem-1", jewelryId: null }],
    } as never);
    prismaMock.order.update.mockResolvedValue({} as never);
    prismaMock.gemstone.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.notification.create.mockResolvedValue({} as never);

    const result = await cancelPendingOrder("order-1");

    expect(result).toEqual({ cancelled: true });
    expect(prismaMock.order.update).toHaveBeenCalledWith({ where: { id: "order-1" }, data: { status: "CANCELLED" } });
    expect(prismaMock.gemstone.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["gem-1"] }, stockStatus: "RESERVED" },
      data: { stockStatus: "AVAILABLE" },
    });
  });

  it("notifies the customer by default (an admin cancelling on their behalf)", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PENDING_PAYMENT", items: [] } as never);
    prismaMock.order.update.mockResolvedValue({} as never);
    prismaMock.notification.create.mockResolvedValue({} as never);

    await cancelPendingOrder("order-1");

    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
  });

  it("skips the notification when the customer cancels their own order", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PENDING_PAYMENT", items: [] } as never);
    prismaMock.order.update.mockResolvedValue({} as never);

    await cancelPendingOrder("order-1", { notifyCustomer: false });

    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });
});

describe("markOrderShipped", () => {
  beforeEach(() => {
    prismaMock.order.update.mockResolvedValue({} as never);
    prismaMock.notification.create.mockResolvedValue({} as never);
    vi.mocked(sendEmail).mockResolvedValue({ ok: true });
    vi.mocked(registerTracking).mockResolvedValue({ ok: true });
  });

  it("refuses to ship an order that isn't PAID", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PENDING_PAYMENT" } as never);

    const result = await markOrderShipped("order-1", { carrier: "DHL", trackingNumber: "123" });

    expect(result).toEqual({ ok: false, error: "Only a paid order can be marked shipped." });
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it("marks a paid order shipped with the carrier/tracking details and a shippedAt timestamp", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PAID" } as never);

    const result = await markOrderShipped("order-1", { carrier: "DHL Express", trackingNumber: "1Z999", trackingUrl: "https://dhl.com/track/1Z999" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { status: "SHIPPED", carrier: "DHL Express", trackingNumber: "1Z999", trackingUrl: "https://dhl.com/track/1Z999", shippedAt: expect.any(Date) },
    });
  });

  it("registers the tracking number with 17track", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PAID" } as never);

    await markOrderShipped("order-1", { carrier: "DHL", trackingNumber: "1Z999" });

    expect(registerTracking).toHaveBeenCalledWith("1Z999");
  });

  it("still succeeds even if 17track registration fails (best-effort)", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PAID" } as never);
    vi.mocked(registerTracking).mockResolvedValue({ ok: false, error: "not configured" });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await markOrderShipped("order-1", { carrier: "DHL", trackingNumber: "1Z999" });

    expect(result).toEqual({ ok: true });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("notifies the customer and sends a shipment email", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PAID" } as never);

    await markOrderShipped("order-1", { carrier: "DHL", trackingNumber: "1Z999" });

    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-1", requestType: "order", requestId: "order-1" }) }),
    );
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "customer@example.com", subject: expect.stringContaining("shipped") }));
  });
});

describe("markOrderDelivered", () => {
  beforeEach(() => {
    prismaMock.order.update.mockResolvedValue({} as never);
    prismaMock.notification.create.mockResolvedValue({} as never);
    vi.mocked(sendEmail).mockResolvedValue({ ok: true });
  });

  it("is a no-op (not an error) for an order that isn't SHIPPED — safe for a retried webhook or a double-click", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "PAID" } as never);

    const result = await markOrderDelivered("order-1");

    expect(result).toEqual({ ok: false });
    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it("marks a shipped order delivered with a deliveredAt timestamp", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "SHIPPED" } as never);

    const result = await markOrderDelivered("order-1", { source: "admin" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.order.update).toHaveBeenCalledWith({ where: { id: "order-1" }, data: { status: "DELIVERED", deliveredAt: expect.any(Date) } });
  });

  it("works identically whether triggered by an admin or the 17track webhook", async () => {
    prismaMock.order.findUniqueOrThrow.mockResolvedValue({ ...baseOrder, status: "SHIPPED" } as never);

    const result = await markOrderDelivered("order-1", { source: "17track" });

    expect(result).toEqual({ ok: true });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: expect.stringContaining("delivered") }));
  });
});
