"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { toggleWishlist } from "@/lib/wishlist";

export type ToggleWishlistResult = { ok: true; saved: boolean } | { ok: false; error: string };

export async function toggleWishlistAction(input: { gemstoneId?: string; jewelryId?: string }): Promise<ToggleWishlistResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };
  if (!input.gemstoneId && !input.jewelryId) return { ok: false, error: "No item specified." };

  const { saved } = await toggleWishlist(session.user.id, input);
  revalidatePath("/account/wishlist");
  return { ok: true, saved };
}
