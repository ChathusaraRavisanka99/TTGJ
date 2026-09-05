import { prisma } from "@/lib/prisma";
import { getCommerceSettings } from "@/lib/commerce-settings";
import { resolveShippingRate } from "@/lib/shipping";
import { getActivePromotionMaps } from "@/lib/promotion-items";
import { isBirthdayEligible } from "@/lib/birthday-promo";

const SRI_LANKA_NAMES = new Set(["sri lanka", "srilanka", "lk", "ceylon"]);

export function isSriLanka(country: string): boolean {
  return SRI_LANKA_NAMES.has(country.trim().toLowerCase());
}

export interface CheckoutLineItem {
  gemstoneId: string | null;
  jewelryId: string | null;
  label: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CheckoutBreakdown {
  // Always "USD" today — the catalog's own canonical currency (see the
  // retailPrice field comment in schema.prisma). Orders are charged
  // directly in USD through PayHere (which settles USD/EUR/GBP/AUD as
  // well as LKR) rather than this app pre-converting to LKR itself: a
  // Sri Lankan customer's card issuer converts USD to LKR at the card
  // network's own real-time rate when the charge settles, the same way
  // it would for any other international USD purchase — that's a better
  // rate than a manually-updated admin setting could ever track. Kept as
  // its own field (not hardcoded "USD" at every call site) so a future
  // customer-facing currency choice (EUR/GBP/AUD) is a config change, not
  // a schema one.
  currency: "USD";
  discountCodeId: string | null;
  items: CheckoutLineItem[];
  subtotal: number;
  birthdayDiscount: number;
  birthdayEligible: boolean;
  codeDiscount: number;
  tax: number;
  shipping: number;
  shippingZoneLabel: string;
  handlingFee: number;
  total: number;
}

// The one place retail pricing math happens — used both to preview the
// checkout page's breakdown and, immediately before creating the Order
// row, to compute the exact amount PayHere is told to charge. Always
// re-reads live retailPrice/costPrice rather than trusting the cart's
// stored snapshot (RetailCartItem.unitPrice), so a cart never checks out
// at a stale price.
export async function buildCheckoutBreakdown(input: { userId: string; shippingCountry: string }): Promise<CheckoutBreakdown> {
  const [cart, settings, user, promotions] = await Promise.all([
    prisma.retailCart.findUnique({
      where: { userId: input.userId },
      include: { items: { include: { gemstone: true, jewelry: true } }, discountCode: true },
    }),
    getCommerceSettings(),
    prisma.user.findUniqueOrThrow({ where: { id: input.userId } }),
    getActivePromotionMaps(),
  ]);
  if (!cart || cart.items.length === 0) throw new Error("Your cart is empty.");

  // VAT is about the shipping *destination* (Sri Lankan domestic supply
  // vs. a zero-rated export), independent of which currency the charge
  // itself is made in.
  const domestic = isSriLanka(input.shippingCountry);
  const birthdayEligible = isBirthdayEligible(user);

  let subtotal = 0;
  let birthdayDiscount = 0;
  const items: CheckoutLineItem[] = cart.items.map((item) => {
    const product = item.gemstone ?? item.jewelry;
    const unitPrice = product?.retailPrice ?? item.unitPrice;
    const label = item.gemstone?.name ?? item.jewelry?.name ?? "Item";
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    const isPromotional = item.gemstoneId
      ? promotions.gemstonePrices.has(item.gemstoneId)
      : item.jewelryId
        ? promotions.jewelryPrices.has(item.jewelryId)
        : false;
    const costPrice = product?.costPrice ?? null;
    if (birthdayEligible && !isPromotional && costPrice != null) {
      const profit = Math.max(0, unitPrice - costPrice);
      birthdayDiscount += profit * (settings.birthdayDiscountPercent / 100) * item.quantity;
    }

    return { gemstoneId: item.gemstoneId, jewelryId: item.jewelryId, label, unitPrice, quantity: item.quantity, lineTotal };
  });

  const codeDiscount = cart.discountCode?.amountOff ?? 0;
  const afterDiscounts = Math.max(0, subtotal - birthdayDiscount - codeDiscount);

  // The only remaining currency conversion in this app: EMS's own rate
  // card is denominated in LKR (see lib/shipping.ts), so that figure
  // alone gets converted into USD here to fold into an otherwise
  // all-USD total — CommerceSettings.usdToLkrRate exists solely for this,
  // not for pricing the order itself.
  const { zoneLabel: shippingZoneLabel, rateLKR: shippingRateLKR } = await resolveShippingRate(input.shippingCountry);
  const shipping = shippingRateLKR / settings.usdToLkrRate;

  const tax = domestic || settings.applyVatToInternational ? afterDiscounts * (settings.vatPercent / 100) : 0;

  const gatewayCharged = afterDiscounts + tax + shipping;
  const handlingFee = gatewayCharged * ((settings.gatewayCommissionPercent + settings.handlingFeeMarginPercent) / 100);
  const total = gatewayCharged + handlingFee;

  return {
    currency: "USD",
    discountCodeId: cart.discountCodeId,
    items,
    subtotal,
    birthdayDiscount,
    birthdayEligible,
    codeDiscount,
    tax,
    shipping,
    shippingZoneLabel,
    handlingFee,
    total,
  };
}
