import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** For the small, explicit allow-list of order-management actions STAFF is
 * granted — every other admin action keeps using requireAdmin() completely
 * unchanged, so a new admin capability never accidentally becomes
 * available to STAFF just by existing. Always pair this with
 * requireOrderMarketAccess below for anything scoped to a specific order —
 * being STAFF at all says nothing about which store they're allowed to
 * touch. */
export async function requireStaffOrAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** Throws unless this user may act on an order in `orderMarket`. An ADMIN
 * always passes (no market restriction). STAFF passes only if their own
 * staffMarketScope is "both" or matches exactly — re-checked here against
 * the *order's own* market every time, never trusted from whichever list
 * page a request came from. */
export async function requireOrderMarketAccess(user: { role: string; staffMarketScope: string | null }, orderMarket: string): Promise<void> {
  if (user.role === "ADMIN") return;
  if (user.role === "STAFF" && (user.staffMarketScope === "both" || user.staffMarketScope === orderMarket)) return;
  throw new Error("FORBIDDEN");
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
