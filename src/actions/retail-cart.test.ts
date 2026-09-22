import { describe, it, expect, vi } from "vitest";
import { applyRetailDiscountCode } from "@/actions/retail-cart";
import { checkRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }) }));

describe("applyRetailDiscountCode rate limiting", () => {
  it("refuses once the per-user attempt limit is exceeded, before even normalizing the code", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    const result = await applyRetailDiscountCode("WELCOME10");

    expect(result).toEqual({ ok: false, error: "Too many attempts — please wait a few minutes and try again." });
  });

  it("checks a per-user limit of 10 attempts per 10 minutes — a short custom code is otherwise guessable", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0 });

    await applyRetailDiscountCode("ABC");

    expect(checkRateLimit).toHaveBeenCalledWith("apply-discount:user-1", { limit: 10, windowSeconds: 10 * 60 });
  });
});
