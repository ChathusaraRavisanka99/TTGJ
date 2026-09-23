import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";
import { expireUnpaidAuctionWins } from "@/lib/orders";

vi.mock("@/lib/orders", () => ({ expireUnpaidAuctionWins: vi.fn() }));

const SECRET = "test-cron-secret";

function getRequest(authHeader?: string): Request {
  return new Request("http://localhost:3000/api/cron/auction-payment-deadline", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("auction-payment-deadline cron", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects a request with no secret configured server-side", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(getRequest(`Bearer ${SECRET}`));
    expect(res.status).toBe(401);
    expect(expireUnpaidAuctionWins).not.toHaveBeenCalled();
  });

  it("rejects a request with no Authorization header", async () => {
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
    expect(expireUnpaidAuctionWins).not.toHaveBeenCalled();
  });

  it("rejects a request with the wrong bearer token", async () => {
    const res = await GET(getRequest("Bearer wrong-secret"));
    expect(res.status).toBe(401);
    expect(expireUnpaidAuctionWins).not.toHaveBeenCalled();
  });

  it("runs the expiry sweep and returns the count for a correctly authenticated request", async () => {
    vi.mocked(expireUnpaidAuctionWins).mockResolvedValue({ expired: 2 });

    const res = await GET(getRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ expired: 2 });
    expect(expireUnpaidAuctionWins).toHaveBeenCalledOnce();
  });
});
