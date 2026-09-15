"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { PAGE_VISIBILITY_KEYS, type PageVisibilityKey, type PageVisibilityState } from "@/lib/page-visibility";
import { isSubcultureKey } from "@/lib/subculture-collections";
import { getSubcultureContent } from "@/lib/subculture-content";
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
  // handful of paths versus wiring a key-to-path map for so few entries.
  revalidatePath("/", "layout");
  revalidatePath("/promotions");
  revalidatePath("/auction");
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/alt-collections");
  revalidatePath("/sitemap.xml");
  // A subculture collection's public path is its current, admin-editable
  // urlSlug, not this PageVisibility key — see SubcultureContent.urlSlug.
  if (isSubcultureKey(key)) {
    const content = await getSubcultureContent(key);
    revalidatePath(`/collections/${content.urlSlug}`);
  }
  return { ok: true };
}
