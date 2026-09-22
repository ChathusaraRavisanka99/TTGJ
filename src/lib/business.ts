import { prisma } from "@/lib/prisma";

// The cookie /account/business/join/[id] sets for a visitor who isn't
// signed in yet — read back by both sign-up paths (registerCustomer and
// the events.createUser hook in lib/auth.ts), same shape as ref_code /
// captureReferral in lib/rewards.ts. The BusinessAccount's own id (a
// cuid, effectively unguessable) doubles as the invite token — no
// separate field needed, same convention getPublicOrderStatus's order id
// already relies on.
export const BIZ_INVITE_COOKIE = "biz_invite";

/** Attaches a brand-new user to a BusinessAccount from an invite cookie —
 * silent no-op on any invalid/stale token or if the user is somehow
 * already on a team, so a garbled cookie never blocks account creation. */
export async function captureBusinessInvite(newUserId: string, businessAccountId: string): Promise<void> {
  const business = await prisma.businessAccount.findUnique({ where: { id: businessAccountId } });
  if (!business) return;

  await prisma.user.updateMany({
    where: { id: newUserId, businessAccountId: null },
    data: { businessAccountId, businessRole: "MEMBER" },
  });
}
