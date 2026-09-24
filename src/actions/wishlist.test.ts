import { describe, it, expect, vi } from "vitest";
import { toggleWishlistAction } from "@/actions/wishlist";
import { toggleWishlist } from "@/lib/wishlist";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/wishlist", () => ({ toggleWishlist: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";

describe("toggleWishlistAction", () => {
  it("rejects when there's no signed-in session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await toggleWishlistAction({ gemstoneId: "gem-1" });
    expect(result).toEqual({ ok: false, error: "Sign in required." });
    expect(toggleWishlist).not.toHaveBeenCalled();
  });

  it("rejects when no item is specified", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    const result = await toggleWishlistAction({});
    expect(result).toEqual({ ok: false, error: "No item specified." });
    expect(toggleWishlist).not.toHaveBeenCalled();
  });

  it("delegates to toggleWishlist with the session's user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(toggleWishlist).mockResolvedValue({ saved: true });
    const result = await toggleWishlistAction({ gemstoneId: "gem-1" });
    expect(result).toEqual({ ok: true, saved: true });
    expect(toggleWishlist).toHaveBeenCalledWith("user-1", { gemstoneId: "gem-1" });
  });
});
