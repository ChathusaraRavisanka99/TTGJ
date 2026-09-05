import { createHash } from "crypto";

// PayHere Checkout API — see https://support.payhere.lk/api-&-mobile-sdk/checkout-api.
// Sri Lanka's dominant payment gateway (Stripe doesn't support Sri
// Lanka-registered merchants); supports both LKR (local) and USD/EUR/GBP/
// AUD (international cards, USD payouts) through one integration — see
// the plan note in CommerceSettings' schema comment.

function md5Upper(input: string): string {
  return createHash("md5").update(input).digest("hex").toUpperCase();
}

function credentials(): { merchantId: string; merchantSecret: string } {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !merchantSecret) {
    throw new Error("PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET must be set to accept retail payments.");
  }
  return { merchantId, merchantSecret };
}

// PAYHERE_MODE defaults to "sandbox" — deliberately opt-in to "live" so a
// missing/misconfigured env var can never silently start taking real
// payments in a non-production environment.
export function payhereCheckoutUrl(): string {
  const live = process.env.PAYHERE_MODE === "live";
  return live ? "https://www.payhere.lk/pay/checkout" : "https://sandbox.payhere.lk/pay/checkout";
}

// hash = upper(md5(merchant_id + order_id + amount + currency + upper(md5(merchant_secret))))
// `amount` must be formatted to exactly 2 decimal places — PayHere's hash
// check fails otherwise (e.g. "1000.00", not "1000" or "1000.0").
export function generateCheckoutHash(orderId: string, amount: number, currency: string): string {
  const { merchantId, merchantSecret } = credentials();
  const amountFormatted = amount.toFixed(2);
  return md5Upper(`${merchantId}${orderId}${amountFormatted}${currency}${md5Upper(merchantSecret)}`);
}

export interface PayhereCheckoutFields {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

export function buildPayhereCheckoutFields(input: {
  /** The order's own sequential number (ORD-2026-0007) — sent to PayHere
   * as order_id and used in the hash/notify verification. Human-readable
   * and guessable on purpose (it's just a reference), which is exactly
   * why it's NOT what return_url/cancel_url use below. */
  orderNumber: string;
  /** The order's internal id (cuid) — high-entropy, not sequential, safe
   * to put in a public (no-session-required) redirect URL without it
   * doubling as a way to enumerate other customers' orders. See
   * getPublicOrderStatus in actions/checkout.ts and the middleware
   * comment on why /checkout/return and /checkout/cancel are public. */
  orderRecordId: string;
  amount: number;
  currency: string;
  items: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  appUrl: string;
}): PayhereCheckoutFields {
  const { merchantId } = credentials();
  const amountFormatted = input.amount.toFixed(2);
  return {
    merchant_id: merchantId,
    return_url: `${input.appUrl}/checkout/return?order=${encodeURIComponent(input.orderRecordId)}`,
    cancel_url: `${input.appUrl}/checkout/cancel?order=${encodeURIComponent(input.orderRecordId)}`,
    notify_url: `${input.appUrl}/api/payhere/notify`,
    order_id: input.orderNumber,
    items: input.items,
    currency: input.currency,
    amount: amountFormatted,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    address: input.address,
    city: input.city,
    country: input.country,
    hash: generateCheckoutHash(input.orderNumber, input.amount, input.currency),
  };
}

// PayHere's payment-status codes on the notify_url webhook.
export const PAYHERE_STATUS = {
  SUCCESS: 2,
  PENDING: 0,
  CANCELLED: -1,
  FAILED: -2,
  CHARGEDBACK: -3,
} as const;

// md5sig = upper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + upper(md5(merchant_secret))))
// Never treat a payment as successful without this passing first — a
// third party could otherwise POST a fabricated "success" notification.
export function verifyPayhereNotification(input: {
  merchantId: string;
  orderId: string;
  payhereAmount: string;
  payhereCurrency: string;
  statusCode: string;
  md5sig: string;
}): boolean {
  const { merchantSecret } = credentials();
  const expected = md5Upper(
    `${input.merchantId}${input.orderId}${input.payhereAmount}${input.payhereCurrency}${input.statusCode}${md5Upper(merchantSecret)}`,
  );
  return expected === input.md5sig.toUpperCase();
}
