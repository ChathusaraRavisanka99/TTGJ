import { prisma } from "@/lib/prisma";

// Lazily-created singleton row (fixed id "singleton") — same
// self-provisioning pattern lib/media.ts's storage bucket uses, so this
// works against the existing prod DB with no migration-time data needed.
// The create() can lose a race to a concurrent first call; that's fine,
// the loser just reads back what the winner created.
export async function getCommerceSettings() {
  const existing = await prisma.commerceSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  try {
    return await prisma.commerceSettings.create({ data: { id: "singleton" } });
  } catch {
    return prisma.commerceSettings.findUniqueOrThrow({ where: { id: "singleton" } });
  }
}
