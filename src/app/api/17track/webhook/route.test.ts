import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { POST } from "./route";
import { markOrderDelivered } from "@/lib/orders";

vi.mock("@/lib/orders", () => ({ markOrderDelivered: vi.fn() }));

const SECRET = "test-webhook-secret";

function postRequest(body: unknown, secret = SECRET): Request {
  return new Request(`http://localhost:3000/api/17track/webhook?secret=${secret}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("17track webhook", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.TRACK17_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects a request with no secret configured server-side", async () => {
    delete process.env.TRACK17_WEBHOOK_SECRET;
    const res = await POST(postRequest({ event: "TRACKING_DELIVERED", data: { number: "1Z999" } }));
    expect(res.status).toBe(401);
  });

  it("rejects a request with the wrong secret", async () => {
    const res = await POST(postRequest({ event: "TRACKING_DELIVERED", data: { number: "1Z999" } }, "wrong-secret"));
    expect(res.status).toBe(401);
    expect(markOrderDelivered).not.toHaveBeenCalled();
  });

  it("returns 200 OK for a malformed body without throwing", async () => {
    const req = new Request(`http://localhost:3000/api/17track/webhook?secret=${SECRET}`, { method: "POST", body: "not json" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns OK and does nothing when no order matches the tracking number", async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);
    const res = await POST(postRequest({ event: "TRACKING_DELIVERED", data: { number: "unknown-number" } }));
    expect(res.status).toBe(200);
    expect(markOrderDelivered).not.toHaveBeenCalled();
  });

  it("marks the matching SHIPPED order delivered on a delivered event", async () => {
    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" } as never);
    vi.mocked(markOrderDelivered).mockResolvedValue({ ok: true });

    const res = await POST(postRequest({ event: "TRACKING_DELIVERED", data: { number: "1Z999" } }));

    expect(res.status).toBe(200);
    expect(prismaMock.order.findFirst).toHaveBeenCalledWith({ where: { trackingNumber: "1Z999", status: "SHIPPED" } });
    expect(markOrderDelivered).toHaveBeenCalledWith("order-1", { source: "17track" });
  });

  it("does not mark delivered for a non-delivered status update", async () => {
    prismaMock.order.findFirst.mockResolvedValue({ id: "order-1" } as never);

    const res = await POST(postRequest({ event: "TRACKING_UPDATED", data: { number: "1Z999", track_info: { latest_status: { status: "InTransit" } } } }));

    expect(res.status).toBe(200);
    expect(markOrderDelivered).not.toHaveBeenCalled();
  });
});
