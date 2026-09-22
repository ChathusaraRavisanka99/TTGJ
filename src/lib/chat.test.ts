import { describe, it, expect } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getChatContext, getOrCreateChatThread } from "@/lib/chat";

// Covers only the "order" request type added for the admin order detail
// page's chat panel (see admin/orders/[id]/page.tsx and the customer's own
// order detail page) — quote/sourcing/general were already exercised
// end-to-end via the app's Playwright checks before this file existed.
describe("chat: order request type", () => {
  it("getChatContext resolves an order's customer and existing thread", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ userId: "user-1", chatThread: { id: "thread-1" } } as never);

    const context = await getChatContext("order", "order-1");

    expect(context).toEqual({ threadId: "thread-1", customerId: "user-1" });
    expect(prismaMock.order.findUnique).toHaveBeenCalledWith({ where: { id: "order-1" }, select: { userId: true, chatThread: { select: { id: true } } } });
  });

  it("getChatContext returns null for an order that doesn't exist", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    expect(await getChatContext("order", "missing")).toBeNull();
  });

  it("getOrCreateChatThread reuses an existing order thread instead of creating a second one", async () => {
    prismaMock.chatThread.findFirst.mockResolvedValue({ id: "thread-1" } as never);

    const threadId = await getOrCreateChatThread("order", "order-1");

    expect(threadId).toBe("thread-1");
    expect(prismaMock.chatThread.findFirst).toHaveBeenCalledWith({ where: { orderId: "order-1" }, select: { id: true } });
    expect(prismaMock.chatThread.create).not.toHaveBeenCalled();
  });

  it("getOrCreateChatThread creates one keyed by orderId when none exists yet", async () => {
    prismaMock.chatThread.findFirst.mockResolvedValue(null);
    prismaMock.chatThread.create.mockResolvedValue({ id: "thread-new" } as never);

    const threadId = await getOrCreateChatThread("order", "order-1");

    expect(threadId).toBe("thread-new");
    expect(prismaMock.chatThread.create).toHaveBeenCalledWith({ data: { orderId: "order-1" } });
  });
});
