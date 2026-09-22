import { describe, it, expect } from "vitest";
import { designLabel, designKind, formatWhen } from "@/lib/account-hub";

describe("designLabel", () => {
  it("labels a configured gem with its mineral and cut", () => {
    const quote = { productType: "CUSTOM", configuredSpec: { mineralName: "Sapphire", cutName: "Oval" } };
    expect(designLabel(quote)).toBe("Configured Sapphire (Oval)");
  });

  it("labels a configured gem with no cut chosen yet", () => {
    const quote = { productType: "CUSTOM", configuredSpec: { mineralName: "Ruby", cutName: null } };
    expect(designLabel(quote)).toBe("Configured Ruby");
  });

  it("falls back to a plain custom-design label with no configured spec", () => {
    expect(designLabel({ productType: "CUSTOM", configuredSpec: null })).toBe("Custom Design");
  });
});

describe("designKind", () => {
  it("is 'Configured gem' when a spec exists", () => {
    expect(designKind({ configuredSpec: { mineralName: "Sapphire" } })).toBe("Configured gem");
  });

  it("is 'Custom piece' with no spec", () => {
    expect(designKind({ configuredSpec: null })).toBe("Custom piece");
  });
});

describe("formatWhen", () => {
  it("shows just a time for something from today", () => {
    const now = new Date();
    const result = formatWhen(now);
    expect(result).not.toMatch(/\d{4}/); // no year in a same-day timestamp
  });

  it("shows a month/day for something from an earlier date", () => {
    const earlier = new Date("2020-03-15T12:00:00Z");
    expect(formatWhen(earlier)).toMatch(/Mar/);
  });
});
