import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getUnreadCountsFor } from "@/lib/chat";

vi.mock("@/lib/discount-codes", () => ({ cartTotal: vi.fn() }));

describe("getUnreadCountsFor", () => {
  it("returns nothing for nothing and touches no table", async () => {
    expect(await getUnreadCountsFor([], "ADMIN")).toEqual([]);
    expect(prismaMock.chatThread.findMany).not.toHaveBeenCalled();
  });

  it("maps each conversation to its own thread's count, in input order, using two queries", async () => {
    prismaMock.chatThread.findMany.mockResolvedValue([
      { id: "t-quote", quoteRequestId: "q1", sourcingRequestId: null, orderId: null, generalUserId: null },
      { id: "t-order", quoteRequestId: null, sourcingRequestId: null, orderId: "o1", generalUserId: null },
      { id: "t-general", quoteRequestId: null, sourcingRequestId: null, orderId: null, generalUserId: "u1" },
    ] as never);
    prismaMock.$queryRaw.mockResolvedValue([
      { threadId: "t-quote", unread: BigInt(3) },
      { threadId: "t-general", unread: 1 },
    ] as never);

    const result = await getUnreadCountsFor(
      [
        { requestType: "order", requestId: "o1" },
        { requestType: "quote", requestId: "q1" },
        { requestType: "general", requestId: "u1" },
        { requestType: "sourcing", requestId: "no-thread-yet" },
      ],
      "ADMIN",
    );

    expect(result).toEqual([0, 3, 1, 0]);
    expect(prismaMock.chatThread.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("skips the count query when none of the conversations has a thread yet", async () => {
    prismaMock.chatThread.findMany.mockResolvedValue([] as never);
    expect(await getUnreadCountsFor([{ requestType: "quote", requestId: "q9" }], "CUSTOMER")).toEqual([0]);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });
});
