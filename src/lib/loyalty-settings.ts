import { prisma } from "@/lib/prisma";

// Lazily-created singleton row (fixed id "singleton") — same
// self-provisioning pattern as getCommerceSettings. The create() can lose
// a race to a concurrent first call; that's fine, the loser just reads
// back what the winner created.
export async function getLoyaltySettings() {
  const existing = await prisma.loyaltySettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  try {
    return await prisma.loyaltySettings.create({ data: { id: "singleton" } });
  } catch {
    return prisma.loyaltySettings.findUniqueOrThrow({ where: { id: "singleton" } });
  }
}
