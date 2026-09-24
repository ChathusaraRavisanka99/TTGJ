// The one definition of "this account is disabled right now" — used by
// sign-in, the session checks, and the admin screens. Edge-safe.
export function isUserDisabled(user: { disabledAt: Date | null; disabledUntil: Date | null } | null | undefined, now: Date = new Date()): boolean {
  if (!user?.disabledAt) return false;
  return user.disabledUntil == null || user.disabledUntil > now;
}

export function describeDisabled(user: { disabledAt: Date | null; disabledUntil: Date | null }, now: Date = new Date()): string | null {
  if (!isUserDisabled(user, now)) return null;
  return user.disabledUntil ? `Disabled until ${user.disabledUntil.toLocaleDateString()}` : "Disabled permanently";
}
