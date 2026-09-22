import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { submitQuoteRequest, submitCustomJewelryRequest, submitSourcingRequest } from "@/actions/quotes";
import { checkRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(), getClientIp: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }) }));

const BLOCKED_MESSAGE = "You've submitted a lot of requests recently — please wait a while before submitting another.";

describe("submission rate limiting — quote/sourcing/custom-design", () => {
  it("submitQuoteRequest refuses once the per-user submission limit is exceeded", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const result = await submitQuoteRequest({ gemstoneId: "gem-1" });

    expect(result).toEqual({ ok: false, error: BLOCKED_MESSAGE });
    expect(prismaMock.quoteRequest.create).not.toHaveBeenCalled();
  });

  it("submitSourcingRequest refuses once the per-user submission limit is exceeded", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const formData = new FormData();
    formData.set("mineralDescription", "A 2ct blue sapphire");
    const result = await submitSourcingRequest(formData);

    expect(result).toEqual({ ok: false, error: BLOCKED_MESSAGE });
    expect(prismaMock.sourcingRequest.create).not.toHaveBeenCalled();
  });

  it("submitCustomJewelryRequest refuses once the per-user submission limit is exceeded", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const formData = new FormData();
    formData.set("description", "A custom sapphire ring with a halo of diamonds");
    const result = await submitCustomJewelryRequest(formData);

    expect(result).toEqual({ ok: false, error: BLOCKED_MESSAGE });
    expect(prismaMock.quoteRequest.create).not.toHaveBeenCalled();
  });

  it("shares one rate-limit bucket per user across all three submission kinds", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9 });
    prismaMock.quoteRequest.create.mockResolvedValue({} as never);

    await submitQuoteRequest({ gemstoneId: "gem-1" });

    expect(checkRateLimit).toHaveBeenCalledWith("submit-request:user-1", { limit: 10, windowSeconds: 60 * 60 });
  });

  it("proceeds normally when a quote request is submitted under the limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 9 });
    prismaMock.quoteRequest.create.mockResolvedValue({} as never);

    const result = await submitQuoteRequest({ gemstoneId: "gem-1" });

    expect(result).toEqual({ ok: true });
    expect(prismaMock.quoteRequest.create).toHaveBeenCalledTimes(1);
  });
});
