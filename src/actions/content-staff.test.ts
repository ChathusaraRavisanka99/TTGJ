import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateHomeText, addHeroSlide, updateAboutRows, updateCartContent, updateLkPaymentsContent, setActiveSeasonalTheme } from "@/actions/page-content";
import { setPageVisibility } from "@/actions/page-visibility";
import { auth } from "@/lib/auth";

// Real rbac on purpose — only the session is faked.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/media", () => ({ saveUploadedMedia: vi.fn() }));
vi.mock("@/lib/page-content", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/page-content")>();
  return { ...actual, savePageContent: vi.fn(), getHomeContent: vi.fn().mockResolvedValue({}), getSeasonalContent: vi.fn().mockResolvedValue({}) };
});

function staff(scope: "intl" | "lk" | "both", permissions: string[] = ["content"]) {
  vi.mocked(auth).mockResolvedValue({ user: { id: "staff-1", role: "STAFF", staffMarketScope: scope, staffPermissions: permissions } } as never);
}

const homeText = () => {
  const fd = new FormData();
  for (const k of ["heroKicker", "heroHeadingLine1", "heroHeadingLine2", "heroHeadingHighlight", "heroSubtext", "heritageKicker", "heritageHeading", "heritageBody", "sourcingKicker", "sourcingHeading", "sourcingBody", "editorialQuote", "editorialQuoteHighlight", "editorialAttribution", "closingKicker", "closingHeading", "closingBody"]) fd.set(k, "x");
  return fd;
};

beforeEach(() => {
  vi.mocked(auth).mockReset();
});

describe("STAFF without the content area", () => {
  it("can't edit the home or about page", async () => {
    staff("both", ["orders", "catalog"]);
    await expect(updateHomeText(homeText(), "intl")).rejects.toThrow("FORBIDDEN");
    await expect(updateAboutRows([])).rejects.toThrow("FORBIDDEN");
  });
});

describe("STAFF with the content area — market scope on the home page", () => {
  it("can't edit the other store's home page", async () => {
    staff("lk");
    await expect(updateHomeText(homeText(), "intl")).rejects.toThrow("FORBIDDEN");
    await expect(addHeroSlide(new FormData(), "intl")).rejects.toThrow("FORBIDDEN");
  });

  it("can edit their own store's home page", async () => {
    staff("lk");
    const result = await updateHomeText(homeText(), "lk");
    expect(result).toEqual({ ok: true });
  });

  it("a both-store member can edit either", async () => {
    staff("both");
    expect(await updateHomeText(homeText(), "intl")).toEqual({ ok: true });
    expect(await updateHomeText(homeText(), "lk")).toEqual({ ok: true });
  });
});

describe("STAFF with the content area — still not the sensitive parts", () => {
  it("can't touch payment instructions, seasonal themes or page visibility", async () => {
    staff("both", ["orders", "catalog", "content", "requests", "reviews"]);
    await expect(updateCartContent("Send money to my account")).rejects.toThrow("FORBIDDEN");
    await expect(updateLkPaymentsContent("Send money to my account")).rejects.toThrow("FORBIDDEN");
    await expect(setActiveSeasonalTheme("valentine" as never, "intl")).rejects.toThrow("FORBIDDEN");
    await expect(setPageVisibility("seasonal" as never, "LIVE" as never)).rejects.toThrow("FORBIDDEN");
  });
});
