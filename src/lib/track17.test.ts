import { describe, it, expect, vi, afterEach } from "vitest";
import { registerTracking, parseTrack17Webhook } from "@/lib/track17";

describe("registerTracking", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  it("no-ops without throwing when TRACK17_API_KEY isn't configured", async () => {
    delete process.env.TRACK17_API_KEY;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as never;

    const result = await registerTracking("1Z999AA10123456784");

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/configured/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("registers the tracking number without a carrier (lets 17track auto-detect)", async () => {
    process.env.TRACK17_API_KEY = "test-key";
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ code: 0, data: { accepted: [{ number: "1Z999" }] } }) });
    global.fetch = fetchSpy as never;

    const result = await registerTracking("1Z999AA10123456784");

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/register"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "17token": "test-key" }),
        body: JSON.stringify([{ number: "1Z999AA10123456784" }]),
      }),
    );
  });

  it("reports failure when 17track's API returns a non-zero code", async () => {
    process.env.TRACK17_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ code: -1, data: { rejected: [{ number: "bad" }] } }) }) as never;

    const result = await registerTracking("bad");

    expect(result.ok).toBe(false);
  });

  it("catches a thrown exception (e.g. a network failure) rather than propagating it", async () => {
    process.env.TRACK17_API_KEY = "test-key";
    global.fetch = vi.fn().mockRejectedValue(new Error("fetch failed")) as never;

    const result = await registerTracking("1Z999AA10123456784");

    expect(result).toEqual({ ok: false, error: "fetch failed" });
  });
});

describe("parseTrack17Webhook", () => {
  it("recognizes a delivered event via a top-level event name", () => {
    const result = parseTrack17Webhook({ event: "TRACKING_DELIVERED", data: { number: "1Z999" } });
    expect(result).toEqual({ trackingNumber: "1Z999", delivered: true });
  });

  it("recognizes a delivered event via a nested latest_status.status", () => {
    const result = parseTrack17Webhook({ data: { number: "1Z999", track_info: { latest_status: { status: "Delivered" } } } });
    expect(result).toEqual({ trackingNumber: "1Z999", delivered: true });
  });

  it("reports a non-delivered event as delivered: false, not null", () => {
    const result = parseTrack17Webhook({ event: "TRACKING_UPDATED", data: { number: "1Z999", track_info: { latest_status: { status: "InTransit" } } } });
    expect(result).toEqual({ trackingNumber: "1Z999", delivered: false });
  });

  it("returns null for a payload with no tracking number", () => {
    expect(parseTrack17Webhook({ event: "TRACKING_DELIVERED", data: {} })).toBeNull();
  });

  it("returns null for a completely malformed payload rather than throwing", () => {
    expect(parseTrack17Webhook(null)).toBeNull();
    expect(parseTrack17Webhook("just a string")).toBeNull();
    expect(parseTrack17Webhook(42)).toBeNull();
    expect(parseTrack17Webhook({})).toBeNull();
  });
});
