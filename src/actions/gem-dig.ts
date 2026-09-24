"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { playGemDig } from "@/lib/gem-dig";

export type PlayGemDigActionResult = { ok: true; points: number } | { ok: false; error: string };

export async function playGemDigAction(orderId: string): Promise<PlayGemDigActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const result = await playGemDig(orderId, session.user.id);
  if (!result.ok) return result;

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}/dig`);
  return result;
}
