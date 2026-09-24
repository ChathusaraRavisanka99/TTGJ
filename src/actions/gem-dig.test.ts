import { describe, it, expect, vi } from "vitest";
import { playGemDigAction } from "@/actions/gem-dig";
import { playGemDig } from "@/lib/gem-dig";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/gem-dig", () => ({ playGemDig: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

describe("playGemDigAction", () => {
  it("rejects when there's no signed-in session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await playGemDigAction("order-1");
    expect(result).toEqual({ ok: false, error: "Sign in required." });
    expect(playGemDig).not.toHaveBeenCalled();
  });

  it("delegates to playGemDig with the session's user id and returns its result", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(playGemDig).mockResolvedValue({ ok: true, points: 3 });
    const result = await playGemDigAction("order-1");
    expect(result).toEqual({ ok: true, points: 3 });
    expect(playGemDig).toHaveBeenCalledWith("order-1", "user-1");
  });

  it("passes through a failure from playGemDig unchanged", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(playGemDig).mockResolvedValue({ ok: false, error: "This reward has already been claimed." });
    const result = await playGemDigAction("order-1");
    expect(result).toEqual({ ok: false, error: "This reward has already been claimed." });
  });
});
