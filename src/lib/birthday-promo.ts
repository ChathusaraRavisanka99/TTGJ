// Shared by the retail cart preview (shows the "🎂 happy birthday" cart
// message) and lib/checkout.ts (which actually applies the discount) so
// the two can never disagree about whether today qualifies.
//
// Eligible any day within the customer's birth month, but only once per
// calendar year — User.lastBirthdayDiscountAt is stamped only once an
// order actually completes (see app/api/payhere/notify/route.ts), never
// just for having it previewed in the cart.
export function isBirthdayEligible(user: { dateOfBirth: Date | null; lastBirthdayDiscountAt: Date | null }, now = new Date()): boolean {
  if (!user.dateOfBirth) return false;
  const birthMonthMatches = user.dateOfBirth.getUTCMonth() === now.getUTCMonth();
  if (!birthMonthMatches) return false;
  const alreadyUsedThisYear = user.lastBirthdayDiscountAt != null && user.lastBirthdayDiscountAt.getUTCFullYear() === now.getUTCFullYear();
  return !alreadyUsedThisYear;
}
