"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { PAGE_VISIBILITY_KEYS, type PageVisibilityKey, type PageVisibilityState } from "@/lib/page-visibility";
import type { ActionResult } from "./auth";

const STATES: PageVisibilityState[] = ["HIDDEN", "COMING_SOON", "LIVE"];

export async function setPageVisibility(key: PageVisibilityKey, state: PageVisibilityState): Promise<ActionResult> {
  await requireAdmin();
  if (!PAGE_VISIBILITY_KEYS.includes(key)) return { ok: false, error: "Unknown page." };
  if (!STATES.includes(state)) return { ok: false, error: "Invalid state." };

  await prisma.pageVisibility.upsert({
    where: { key },
    update: { state },
    create: { key, state },
  });

  // Every route this could plausibly affect — cheap to over-revalidate a
  // couple of paths versus wiring a key-to-path map for two entries.
  revalidatePath("/", "layout");
  revalidatePath("/promotions");
  revalidatePath("/auction");
  revalidatePath("/admin/promotions");
  return { ok: true };
}
