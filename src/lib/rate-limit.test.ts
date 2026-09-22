import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

describe("checkRateLimit", () => {
  it("allows a request when the returned count is at or under the limit", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 3 }]);
    const result = await checkRateLimit("login-email:user@example.com", { limit: 5, windowSeconds: 900 });
    expect(result).toEqual({ allowed: true, remaining: 2 });
  });

  it("allows a request exactly at the limit", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 5 }]);
    const result = await checkRateLimit("login-email:user@example.com", { limit: 5, windowSeconds: 900 });
    expect(result).toEqual({ allowed: true, remaining: 0 });
  });

  it("blocks a request once the count exceeds the limit", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 6 }]);
    const result = await checkRateLimit("login-email:user@example.com", { limit: 5, windowSeconds: 900 });
    expect(result).toEqual({ allowed: false, remaining: 0 });
  });

  it("treats a missing row in the query result as count 1 (allowed)", async () => {
    prismaMock.$queryRaw.mockResolvedValue([]);
    const result = await checkRateLimit("some-key", { limit: 5, windowSeconds: 900 });
    expect(result).toEqual({ allowed: true, remaining: 4 });
  });
});

describe("getClientIp", () => {
  async function mockHeaders(values: Record<string, string | undefined>) {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValue({ get: (name: string) => values[name] ?? null } as never);
  }

  it("uses the first address in x-forwarded-for (the original client, not intermediate proxies)", async () => {
    await mockHeaders({ "x-forwarded-for": "203.0.113.4, 10.0.0.1, 10.0.0.2" });
    expect(await getClientIp()).toBe("203.0.113.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    await mockHeaders({ "x-real-ip": "198.51.100.7" });
    expect(await getClientIp()).toBe("198.51.100.7");
  });

  it("falls back to a shared constant when neither header is present, rather than throwing", async () => {
    await mockHeaders({});
    expect(await getClientIp()).toBe("unknown");
  });
});
