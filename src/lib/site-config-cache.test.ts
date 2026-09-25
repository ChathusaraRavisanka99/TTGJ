import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getCachedPageVisibilities, getCachedSeasonalContent, SITE_CONFIG_TAG } from "@/lib/site-config-cache";
import { setPageVisibility } from "@/actions/page-visibility";
import { revalidateTag } from "next/cache";

vi.mock("@/lib/rbac", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }) }));

describe("site config cache", () => {
  it("still returns what the underlying readers return", async () => {
    prismaMock.pageVisibility.findMany.mockResolvedValue([{ key: "seasonal", state: "LIVE" }] as never);
    const result = await getCachedPageVisibilities(["seasonal", "auction"]);
    expect(result).toEqual({ seasonal: "LIVE", auction: "HIDDEN" });

    prismaMock.pageContent.findUnique.mockResolvedValue(null);
    const seasonal = await getCachedSeasonalContent("intl");
    expect(seasonal.activeTheme).toBeTruthy();
  });

  it("an admin changing a page's visibility drops the cached copy", async () => {
    prismaMock.pageVisibility.upsert.mockResolvedValue({} as never);
    await setPageVisibility("seasonal", "LIVE");
    expect(revalidateTag).toHaveBeenCalledWith(SITE_CONFIG_TAG, { expire: 0 });
  });
});
