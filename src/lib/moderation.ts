// Lightweight heuristic to flag notes that look like they contain a specific
// offer price, so an admin can review — never used to block submission
// outright, since false positives (e.g. "under 2 carats") are expected.
const CURRENCY_SYMBOLS = /[$£€¥]/;
const CURRENCY_CODES = /\b(usd|lkr|rs\.?|rupees?|dollars?|eur|gbp)\b/i;
const NUMBER_NEAR_CURRENCY =
  /(?:[$£€¥]\s?\d|(?:usd|lkr|rs\.?|eur|gbp)\s?\d|\d\s?(?:usd|lkr|rs\.?|eur|gbp|dollars?|rupees?))/i;

export function looksLikePriceOffer(note: string | null | undefined): boolean {
  if (!note) return false;
  if (NUMBER_NEAR_CURRENCY.test(note)) return true;
  if (CURRENCY_SYMBOLS.test(note) && /\d/.test(note)) return true;
  if (CURRENCY_CODES.test(note) && /\d/.test(note)) return true;
  return false;
}
