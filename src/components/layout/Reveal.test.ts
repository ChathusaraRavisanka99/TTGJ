import { describe, expect, it } from "vitest";
import { REVEAL_HIDDEN_OPACITY, REVEAL_VIEWPORT_MARGIN } from "./Reveal";

// Regression guard for a real bug: Reveal's whileInView animation could
// fail to fire in time (slow hydration, a fast scroll, an abrupt resize —
// see the doc comments in Reveal.tsx), and when that happened with a full
// opacity:0 start and a viewport margin that only triggered once a section
// was already on screen, whole sections of the home page rendered blank
// until the user scrolled slowly through them — reported as "overlaps" /
// "bad CSS" in desktop views. These two values are what actually fix that;
// this test exists so reverting either one is caught by a test run, not
// just by someone eyeballing the site again.
describe("Reveal animation floor", () => {
  it("never starts fully invisible", () => {
    expect(REVEAL_HIDDEN_OPACITY).toBeGreaterThan(0);
    expect(REVEAL_HIDDEN_OPACITY).toBeLessThan(1);
  });

  it("pre-triggers before a section is actually on screen (positive bottom margin)", () => {
    // CSS margin shorthand: top right bottom left. A negative bottom
    // margin shrinks the effective viewport (section must already be
    // visible before the reveal starts); it must stay positive here.
    const parts = REVEAL_VIEWPORT_MARGIN.trim().split(/\s+/);
    expect(parts).toHaveLength(4);
    const bottom = parseFloat(parts[2]);
    expect(bottom).toBeGreaterThan(0);
  });
});
