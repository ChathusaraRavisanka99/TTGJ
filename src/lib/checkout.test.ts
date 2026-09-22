import { describe, it, expect } from "vitest";
import { isSriLanka } from "@/lib/checkout";

describe("isSriLanka", () => {
  it.each(["Sri Lanka", "sri lanka", "SRI LANKA", "  Sri Lanka  ", "SriLanka", "Ceylon", "LK"])(
    "recognizes %j as Sri Lanka",
    (country) => {
      expect(isSriLanka(country)).toBe(true);
    },
  );

  it.each(["United States", "India", "", "Sri Lankaa", "Not Sri Lanka"])("does not recognize %j as Sri Lanka", (country) => {
    expect(isSriLanka(country)).toBe(false);
  });
});
