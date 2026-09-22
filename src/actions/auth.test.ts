import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { registerCustomer, authenticateWithCredentials } from "@/actions/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// src/actions/auth.ts imports AuthError directly from "next-auth" (not
// from "@/lib/auth"), which otherwise pulls in the real next-auth package
// and its "next/server" import at module-load time — unnecessary and
// broken in this test environment, since nothing here exercises real
// NextAuth internals (signIn is mocked below).
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn().mockResolvedValue("203.0.113.4"),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => undefined }),
  headers: vi.fn().mockResolvedValue({ get: () => null }),
}));
vi.mock("@/lib/auth", () => ({ signIn: vi.fn().mockResolvedValue(undefined), signOut: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function registerFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const data = { name: "Jane Doe", email: "jane@example.com", password: "password123", ...overrides };
  for (const [key, value] of Object.entries(data)) fd.set(key, value);
  return fd;
}

describe("registerCustomer rate limiting", () => {
  it("refuses to create an account once the per-IP register limit is exceeded", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const result = await registerCustomer(registerFormData());

    expect(result).toEqual({ ok: false, error: "Too many accounts created recently — please try again later." });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("checks the register rate limit keyed by IP with a 5-per-hour cap", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 4 });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "user-1" } as never);

    await registerCustomer(registerFormData());

    expect(checkRateLimit).toHaveBeenCalledWith("register:203.0.113.4", { limit: 5, windowSeconds: 60 * 60 });
  });

  it("proceeds to create the account when the request is under the limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 4 });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "user-1" } as never);

    const result = await registerCustomer(registerFormData());

    expect(result).toEqual({ ok: true });
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
  });
});

describe("authenticateWithCredentials rate limiting", () => {
  function loginFormData(overrides: Record<string, string> = {}): FormData {
    const fd = new FormData();
    const data = { email: "jane@example.com", password: "x", callbackUrl: "/account", ...overrides };
    for (const [key, value] of Object.entries(data)) fd.set(key, value);
    return fd;
  }

  it("refuses to attempt sign-in once the per-email limit is exceeded, even if the IP limit is fine", async () => {
    vi.mocked(checkRateLimit)
      .mockResolvedValueOnce({ allowed: false, remaining: 0 }) // email check (first call)
      .mockResolvedValueOnce({ allowed: true, remaining: 10 }); // ip check (second call)

    const result = await authenticateWithCredentials(loginFormData());

    expect(result).toEqual({ ok: false, error: "Too many sign-in attempts — please wait a few minutes and try again." });
  });

  it("refuses to attempt sign-in once the per-IP limit is exceeded, even if the email limit is fine", async () => {
    vi.mocked(checkRateLimit)
      .mockResolvedValueOnce({ allowed: true, remaining: 4 })
      .mockResolvedValueOnce({ allowed: false, remaining: 0 });

    const result = await authenticateWithCredentials(loginFormData());

    expect(result).toEqual({ ok: false, error: "Too many sign-in attempts — please wait a few minutes and try again." });
  });

  it("checks an email-keyed limit (5/15min) and an IP-keyed limit (20/15min)", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 10 });

    await authenticateWithCredentials(loginFormData());

    expect(checkRateLimit).toHaveBeenCalledWith("login-email:jane@example.com", { limit: 5, windowSeconds: 15 * 60 });
    expect(checkRateLimit).toHaveBeenCalledWith("login-ip:203.0.113.4", { limit: 20, windowSeconds: 15 * 60 });
  });
});
