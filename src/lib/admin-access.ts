// Whether a signed-in user should be shown a link to the admin portal: an
// ADMIN always, a STAFF member only if at least one area is switched on for
// them. Purely a convenience for navigation — the portal itself (proxy,
// layout, every action) does the real checks.
export function hasAdminPortalAccess(user: { role?: string; staffPermissions?: string[] } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || (user.role === "STAFF" && (user.staffPermissions?.length ?? 0) > 0);
}
