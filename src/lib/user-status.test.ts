import { describe, it, expect } from "vitest";
import { isUserDisabled, describeDisabled } from "@/lib/user-status";

const now = new Date("2026-09-25T12:00:00Z");
const day = 24 * 60 * 60 * 1000;

describe("isUserDisabled", () => {
  it("is false for an account that was never disabled, or no account", () => {
    expect(isUserDisabled({ disabledAt: null, disabledUntil: null }, now)).toBe(false);
    expect(isUserDisabled(null, now)).toBe(false);
    expect(isUserDisabled(undefined, now)).toBe(false);
  });

  it("is true for a permanent disable (no end date)", () => {
    expect(isUserDisabled({ disabledAt: new Date(now.getTime() - day), disabledUntil: null }, now)).toBe(true);
  });

  it("is true for a temporary disable that hasn't ended yet", () => {
    expect(isUserDisabled({ disabledAt: new Date(now.getTime() - day), disabledUntil: new Date(now.getTime() + day) }, now)).toBe(true);
  });

  it("lifts by itself once the end date has passed", () => {
    expect(isUserDisabled({ disabledAt: new Date(now.getTime() - 3 * day), disabledUntil: new Date(now.getTime() - day) }, now)).toBe(false);
  });
});

describe("describeDisabled", () => {
  it("says nothing for an active account", () => {
    expect(describeDisabled({ disabledAt: null, disabledUntil: null }, now)).toBeNull();
    expect(describeDisabled({ disabledAt: new Date(now.getTime() - 3 * day), disabledUntil: new Date(now.getTime() - day) }, now)).toBeNull();
  });

  it("distinguishes permanent from temporary", () => {
    expect(describeDisabled({ disabledAt: now, disabledUntil: null }, now)).toBe("Disabled permanently");
    expect(describeDisabled({ disabledAt: now, disabledUntil: new Date(now.getTime() + day) }, now)).toMatch(/^Disabled until /);
  });
});
