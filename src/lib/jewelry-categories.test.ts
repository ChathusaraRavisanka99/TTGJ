import { describe, it, expect } from "vitest";
import { audienceValuesFor, isAudienceSlug, pieceTypeLabel, PIECE_TYPE_ORDER } from "@/lib/jewelry-categories";
import { PIECE_TYPES } from "@/lib/gem-constants";

describe("audienceValuesFor", () => {
  it("shows unisex pieces to men and women too", () => {
    expect(audienceValuesFor("women")).toEqual(["WOMEN", "UNISEX"]);
    expect(audienceValuesFor("men")).toEqual(["MEN", "UNISEX"]);
  });

  it("keeps couple and unisex exact", () => {
    expect(audienceValuesFor("couple")).toEqual(["COUPLE"]);
    expect(audienceValuesFor("unisex")).toEqual(["UNISEX"]);
  });
});

describe("isAudienceSlug", () => {
  it("accepts only the four known slugs", () => {
    expect(isAudienceSlug("women")).toBe(true);
    expect(isAudienceSlug("WOMEN")).toBe(false);
    expect(isAudienceSlug("kids")).toBe(false);
    expect(isAudienceSlug(undefined)).toBe(false);
  });
});

describe("pieceTypeLabel", () => {
  it("has readable singular and plural names, including the multi-word ones", () => {
    expect(pieceTypeLabel("JEWELRY_SET")).toBe("Jewelry Set");
    expect(pieceTypeLabel("JEWELRY_SET", "plural")).toBe("Jewelry Sets");
    expect(pieceTypeLabel("RING", "plural")).toBe("Rings");
    expect(pieceTypeLabel("ANKLET", "plural")).toBe("Anklets");
  });

  it("falls back to a tidied name for an unknown type", () => {
    expect(pieceTypeLabel("HAIR_CLIP")).toBe("Hair clip");
  });
});

describe("piece type lists stay in sync", () => {
  it("the display order and the admin list contain exactly the same types", () => {
    expect([...PIECE_TYPE_ORDER].sort()).toEqual([...PIECE_TYPES].sort());
  });
});
