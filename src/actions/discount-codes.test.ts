import { describe, it, expect, vi } from "vitest";
import { applyDiscountCode } from "@/actions/discount-codes";
import { checkRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }) }));

describe("applyDiscountCode rate limiting", () => {
  it("refuses once the per-user attempt limit is exceeded", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const result = await applyDiscountCode("WELCOME10");

    expect(result).toEqual({ ok: false, error: "Too many attempts — please wait a few minutes and try again." });
  });

  it("shares the same apply-discount:<userId> bucket the retail cart's equivalent action uses", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    await applyDiscountCode("ABC");

    expect(checkRateLimit).toHaveBeenCalledWith("apply-discount:user-1", { limit: 10, windowSeconds: 10 * 60 });
  });
});
