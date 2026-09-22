import { describe, it, expect } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { getLoyaltySettings } from "@/lib/loyalty-settings";

// Same self-provisioning singleton pattern as getCommerceSettings and
// every other lazily-created singleton row in this app — tested once here
// as the canonical example for future reference.
describe("getLoyaltySettings", () => {
  it("returns the existing row without creating one", async () => {
    prismaMock.loyaltySettings.findUnique.mockResolvedValue({ id: "singleton" } as never);
    await getLoyaltySettings();
    expect(prismaMock.loyaltySettings.create).not.toHaveBeenCalled();
  });

  it("creates the row on first use when none exists yet", async () => {
    prismaMock.loyaltySettings.findUnique.mockResolvedValue(null);
    prismaMock.loyaltySettings.create.mockResolvedValue({ id: "singleton" } as never);
    const result = await getLoyaltySettings();
    expect(prismaMock.loyaltySettings.create).toHaveBeenCalledWith({ data: { id: "singleton" } });
    expect(result).toEqual({ id: "singleton" });
  });

  it("falls back to reading the row when create loses a race to a concurrent first call", async () => {
    prismaMock.loyaltySettings.findUnique.mockResolvedValue(null);
    prismaMock.loyaltySettings.create.mockRejectedValue(new Error("Unique constraint failed"));
    prismaMock.loyaltySettings.findUniqueOrThrow.mockResolvedValue({ id: "singleton" } as never);

    const result = await getLoyaltySettings();

    expect(prismaMock.loyaltySettings.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: "singleton" } });
    expect(result).toEqual({ id: "singleton" });
  });
});
