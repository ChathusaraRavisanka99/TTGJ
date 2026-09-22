import { describe, it, expect } from "vitest";
import { isLkPath, withMarket, stripMarket, marketKey } from "@/lib/market-shared";

describe("isLkPath", () => {
  it("matches the bare /lk root", () => {
    expect(isLkPath("/lk")).toBe(true);
  });

  it("matches a nested /lk path", () => {
    expect(isLkPath("/lk/gems/blue-sapphire")).toBe(true);
  });

  it("does not match a path that merely starts with the same letters", () => {
    expect(isLkPath("/lkfoo")).toBe(false);
  });

  it("does not match an international path", () => {
    expect(isLkPath("/gems")).toBe(false);
  });
});

describe("withMarket", () => {
  it("returns the path unchanged for the international market", () => {
    expect(withMarket("/gems/blue-sapphire", "intl")).toBe("/gems/blue-sapphire");
  });

  it("prefixes a plain path for the lk market", () => {
    expect(withMarket("/gems/blue-sapphire", "lk")).toBe("/lk/gems/blue-sapphire");
  });

  it("prefixes the bare root to /lk", () => {
    expect(withMarket("/", "lk")).toBe("/lk");
  });

  it("does not double-prefix an already-prefixed path", () => {
    expect(withMarket("/lk/gems", "lk")).toBe("/lk/gems");
  });

  it("leaves admin, api, media and _next paths unprefixed", () => {
    expect(withMarket("/admin/gems", "lk")).toBe("/admin/gems");
    expect(withMarket("/api/payhere/notify", "lk")).toBe("/api/payhere/notify");
    expect(withMarket("/media/foo.jpg", "lk")).toBe("/media/foo.jpg");
  });

  it("leaves an external URL, hash link or non-root-relative path untouched", () => {
    expect(withMarket("https://example.com", "lk")).toBe("https://example.com");
    expect(withMarket("//evil.example", "lk")).toBe("//evil.example");
    expect(withMarket("#top", "lk")).toBe("#top");
  });

  it("prefixes a path that starts with a query string or hash", () => {
    expect(withMarket("/?x=1", "lk")).toBe("/lk?x=1");
    expect(withMarket("/#top", "lk")).toBe("/lk#top");
  });

  it("rewrites a root-relative callbackUrl query param to stay inside /lk too", () => {
    const result = withMarket("/account/login?callbackUrl=%2Faccount%2Fretail-cart", "lk");
    expect(result).toBe("/lk/account/login?callbackUrl=%2Flk%2Faccount%2Fretail-cart");
  });

  it("leaves an absolute (non-root-relative) callbackUrl untouched, not rewritten into /lk", () => {
    const result = withMarket("/account/login?callbackUrl=https%3A%2F%2Fevil.example", "lk");
    expect(result).toBe("/lk/account/login?callbackUrl=https%3A%2F%2Fevil.example");
  });
});

describe("stripMarket", () => {
  it("strips the /lk prefix from a nested path", () => {
    expect(stripMarket("/lk/gems/blue-sapphire")).toBe("/gems/blue-sapphire");
  });

  it("reduces the bare /lk root to /", () => {
    expect(stripMarket("/lk")).toBe("/");
  });

  it("passes an international path through unchanged", () => {
    expect(stripMarket("/gems/blue-sapphire")).toBe("/gems/blue-sapphire");
  });

  it("round-trips with withMarket for a plain path", () => {
    const original = "/gems/blue-sapphire";
    expect(stripMarket(withMarket(original, "lk"))).toBe(original);
  });
});

describe("marketKey", () => {
  it("prefixes a key for the lk market", () => {
    expect(marketKey("home", "lk")).toBe("lk:home");
  });

  it("leaves the key unprefixed for the international market", () => {
    expect(marketKey("home", "intl")).toBe("home");
  });
});
