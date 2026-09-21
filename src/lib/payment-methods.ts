import type { Market } from "@/lib/market-shared";

// Client-safe (no Prisma import) — the checkout form renders these, and the
// server action re-checks them, from the same list.
//
// International: PayHere card only, as before. Sri Lanka store (/lk): bank
// wire transfer is live; card and cash on delivery are shown but disabled
// as "Coming soon". Flip a method to "live" here once it's actually built —
// the checkout form and the server-side check both follow this one list.

export type PaymentMethodKey = "PAYHERE_CARD" | "WIRE_TRANSFER" | "COD";
export type PaymentMethodStatus = "live" | "coming_soon";

export interface PaymentMethodOption {
  key: PaymentMethodKey;
  status: PaymentMethodStatus;
}

const METHODS: Record<Market, PaymentMethodOption[]> = {
  intl: [{ key: "PAYHERE_CARD", status: "live" }],
  lk: [
    { key: "WIRE_TRANSFER", status: "live" },
    { key: "PAYHERE_CARD", status: "coming_soon" },
    { key: "COD", status: "coming_soon" },
  ],
};

export function paymentMethodsFor(market: Market): PaymentMethodOption[] {
  return METHODS[market];
}

export function isPaymentMethodLive(market: Market, key: string): key is PaymentMethodKey {
  return METHODS[market].some((m) => m.key === key && m.status === "live");
}

/** The method a customer gets without choosing: the first live one. */
export function defaultPaymentMethod(market: Market): PaymentMethodKey {
  return METHODS[market].find((m) => m.status === "live")!.key;
}
