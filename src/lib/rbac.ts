import { auth } from "@/lib/auth";
import type { StaffArea } from "@/lib/staff-permissions";

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

/** For the back-office areas an admin can switch on per STAFF account (see
 * lib/staff-permissions.ts). An ADMIN always passes; a STAFF passes only if
 * that specific area is enabled for them. Every other admin action keeps
 * using requireAdmin() unchanged, so a new admin capability never becomes
 * available to STAFF just by existing. For anything with a market, also
 * call requireMarketAccess: having an area says nothing about which store
 * they may touch. */
export async function requireStaffArea(area: StaffArea) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  if (user.role === "STAFF" && user.staffPermissions.includes(area)) return user;
  throw new Error("FORBIDDEN");
}

/** True when this user is an ADMIN, or a STAFF member with the area
 * enabled. The non-throwing twin of requireStaffArea, for page rendering. */
export function hasStaffArea(user: { role: string; staffPermissions?: string[] } | null | undefined, area: StaffArea): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || (user.role === "STAFF" && (user.staffPermissions ?? []).includes(area));
}

/** Throws unless this user may act on something in `market`. An ADMIN
 * always passes. STAFF passes only if their staffMarketScope is "both" or
 * matches exactly — re-checked against the item's own market every time,
 * never trusted from whichever list page a request came from. */
export async function requireMarketAccess(user: { role: string; staffMarketScope: string | null }, market: string): Promise<void> {
  if (user.role === "ADMIN") return;
  if (user.role === "STAFF" && (user.staffMarketScope === "both" || user.staffMarketScope === market)) return;
  throw new Error("FORBIDDEN");
}

/** Non-throwing twin of requireMarketAccess, for deciding whether a page
 * should render at all (a page answers "not found", never "forbidden"). */
export function hasMarketAccess(user: { role: string; staffMarketScope: string | null }, market: string): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "STAFF" && (user.staffMarketScope === "both" || user.staffMarketScope === market);
}

/** The market filter to apply to a catalog/review query for this user:
 * `undefined` = no restriction (ADMIN, or STAFF scoped to both). */
export function marketFilterFor(user: { role: string; staffMarketScope: string | null }): "intl" | "lk" | undefined {
  if (user.role === "ADMIN") return undefined;
  if (user.staffMarketScope === "intl" || user.staffMarketScope === "lk") return user.staffMarketScope;
  return undefined;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
