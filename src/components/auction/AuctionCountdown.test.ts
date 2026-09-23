import { describe, it, expect } from "vitest";
import { msToCountdownParts } from "@/components/auction/AuctionCountdown";

describe("msToCountdownParts", () => {
  it("breaks a duration down into days/hours/minutes/seconds", () => {
    const ms = 2 * 86400000 + 3 * 3600000 + 4 * 60000 + 5000;
    expect(msToCountdownParts(ms)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("clamps a past target to all zeros instead of going negative", () => {
    expect(msToCountdownParts(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("handles exactly zero", () => {
    expect(msToCountdownParts(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("rolls seconds/minutes/hours over correctly at their boundaries", () => {
    expect(msToCountdownParts(3600000)).toEqual({ days: 0, hours: 1, minutes: 0, seconds: 0 });
    expect(msToCountdownParts(86400000)).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0 });
  });
});
