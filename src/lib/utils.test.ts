import { describe, it, expect } from "vitest";
import { cn, safeCallbackPath, slugify, buildCertVerifyUrl, formatPrice, quoteReference } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("safeCallbackPath", () => {
  it("accepts a plain root-relative path", () => {
    expect(safeCallbackPath("/account/orders")).toBe("/account/orders");
  });

  it("falls back for a missing or non-string value", () => {
    expect(safeCallbackPath(undefined)).toBe("/account");
    expect(safeCallbackPath(null)).toBe("/account");
    expect(safeCallbackPath(42)).toBe("/account");
  });

  it("falls back for an empty string", () => {
    expect(safeCallbackPath("")).toBe("/account");
  });

  it("rejects a value that isn't root-relative (an open-redirect attempt)", () => {
    expect(safeCallbackPath("https://evil.example")).toBe("/account");
  });

  it("rejects a protocol-relative //host value", () => {
    expect(safeCallbackPath("//evil.example")).toBe("/account");
  });

  it("rejects a backslash-prefixed value some browsers still resolve as protocol-relative", () => {
    expect(safeCallbackPath("/\\evil.example")).toBe("/account");
  });

  it("honors a custom fallback", () => {
    expect(safeCallbackPath("https://evil.example", "/lk/account")).toBe("/lk/account");
  });
});

describe("slugify", () => {
  it("lowercases, trims, and hyphenates", () => {
    expect(slugify("  Blue Sapphire, 2.4 ct  ")).toBe("blue-sapphire-2-4-ct");
  });

  it("strips leading/trailing hyphens produced by punctuation at the edges", () => {
    expect(slugify("--Hello World!--")).toBe("hello-world");
  });
});

describe("buildCertVerifyUrl", () => {
  it("substitutes the {certId} placeholder", () => {
    expect(buildCertVerifyUrl("https://lab.example/verify/{certId}", "GIA-123")).toBe("https://lab.example/verify/GIA-123");
  });

  it("returns null when the template is missing", () => {
    expect(buildCertVerifyUrl(null, "GIA-123")).toBeNull();
    expect(buildCertVerifyUrl(undefined, "GIA-123")).toBeNull();
  });

  it("returns null when the cert id is missing", () => {
    expect(buildCertVerifyUrl("https://lab.example/verify/{certId}", null)).toBeNull();
  });

  it("URL-encodes the certificate id", () => {
    expect(buildCertVerifyUrl("https://lab.example/verify/{certId}", "AB 123/45")).toBe("https://lab.example/verify/AB%20123%2F45");
  });
});

describe("formatPrice", () => {
  it("formats USD with the dollar symbol and no decimals", () => {
    expect(formatPrice(1240.5)).toBe("$1,241");
  });

  it("formats LKR with the plain Rs prefix, not Intl's own LKR symbol", () => {
    expect(formatPrice(125000, "LKR")).toBe("Rs 125,000");
  });

  it("rounds an LKR amount to the nearest whole rupee", () => {
    expect(formatPrice(125000.6, "LKR")).toBe("Rs 125,001");
  });
});

describe("quoteReference", () => {
  it("derives an 8-character uppercase reference from the id's tail", () => {
    expect(quoteReference("cknjbsdfsdf12345678")).toBe("Q-12345678");
  });
});
