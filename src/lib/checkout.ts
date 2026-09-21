import { prisma } from "@/lib/prisma";
import { getCommerceSettings } from "@/lib/commerce-settings";
import { resolveShippingRate } from "@/lib/shipping";
import { getActivePromotionMaps } from "@/lib/promotion-items";
import { isBirthdayEligible } from "@/lib/birthday-promo";
import type { Market } from "@/lib/market-shared";
import type { PaymentMethod } from "@prisma/client";

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
  // "LKR" on the Sri Lanka store (/lk), where every amount is already in
  // rupees — its own per-item lkrRetailPrice, the LKR shipping rate used
  // as-is, LKR discount codes — with no conversion anywhere. On the
  // international site it's "USD" — the catalog's own canonical currency (see the
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
  currency: "USD" | "LKR";
  market: Market;
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
//
// `market` picks which cart (one per market — see RetailCart.market) and
// which price columns are read; `paymentMethod` decides whether the card
// gateway's commission/handling margin is added (bank transfer and cash on
// delivery carry no gateway, so no fee).
export async function buildCheckoutBreakdown(input: {
  userId: string;
  shippingCountry: string;
  market?: Market;
  paymentMethod?: PaymentMethod;
}): Promise<CheckoutBreakdown> {
  const market = input.market ?? "intl";
  const lk = market === "lk";
  const [cart, settings, user, promotions] = await Promise.all([
    prisma.retailCart.findUnique({
      where: { userId_market: { userId: input.userId, market } },
      include: { items: { include: { gemstone: true, jewelry: true } }, discountCode: true },
    }),
    getCommerceSettings(),
    prisma.user.findUniqueOrThrow({ where: { id: input.userId } }),
    getActivePromotionMaps(market),
  ]);
  if (!cart || cart.items.length === 0) throw new Error("Your cart is empty.");

  // Every gemstone/jewelry piece in this catalog is one-of-a-kind — no
  // quantity/units field exists anywhere (see StockStatus) — so this has
  // to be a live re-check, not something trusted from whenever the item
  // was added to the cart. Catches both a genuine sale to someone else in
  // the meantime and an admin manually pulling the item. Thrown here
  // (rather than returning a partial breakdown) so this is the single
  // gate every path to creating an Order goes through — see
  // initiateRetailCheckout, which surfaces this message as-is.
  const unavailable = cart.items
    .filter((item) => (item.gemstone ?? item.jewelry)?.stockStatus !== "AVAILABLE")
    .map((item) => item.gemstone?.name ?? item.jewelry?.name ?? "An item");
  if (unavailable.length > 0) {
    const subject = unavailable.join(", ");
    throw new Error(`${subject} ${unavailable.length === 1 ? "is" : "are"} no longer available — please remove ${unavailable.length === 1 ? "it" : "them"} from your cart to continue.`);
  }

  // A piece with no rupee price can't be bought on the Sri Lanka store
  // (it's "Request a Quote" there) — normally it can't get into an LK cart
  // in the first place, but an admin can clear a price after it was added.
  if (lk) {
    const unpriced = cart.items
      .filter((item) => (item.gemstone ?? item.jewelry)?.lkrRetailPrice == null)
      .map((item) => item.gemstone?.name ?? item.jewelry?.name ?? "An item");
    if (unpriced.length > 0) {
      throw new Error(`${unpriced.join(", ")} can't be bought online in rupees right now — please remove ${unpriced.length === 1 ? "it" : "them"} from your cart or request a quote.`);
    }
  }

  // VAT is about the shipping *destination* (Sri Lankan domestic supply
  // vs. a zero-rated export), independent of which currency the charge
  // itself is made in.
  const domestic = isSriLanka(input.shippingCountry);
  const birthdayEligible = isBirthdayEligible(user);

  let subtotal = 0;
  let birthdayDiscount = 0;
  const items: CheckoutLineItem[] = cart.items.map((item) => {
    const product = item.gemstone ?? item.jewelry;
    const unitPrice = lk ? product!.lkrRetailPrice! : (product?.retailPrice ?? item.unitPrice);
    const label = item.gemstone?.name ?? item.jewelry?.name ?? "Item";
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    const isPromotional = item.gemstoneId
      ? promotions.gemstonePrices.has(item.gemstoneId)
      : item.jewelryId
        ? promotions.jewelryPrices.has(item.jewelryId)
        : false;
    // costPrice is always recorded in USD; on /lk convert it so the profit
    // (and so the birthday discount) is computed in rupees against the
    // rupee price.
    const costUsd = product?.costPrice ?? null;
    const costPrice = costUsd != null && lk ? costUsd * settings.usdToLkrRate : costUsd;
    if (birthdayEligible && !isPromotional && costPrice != null) {
      const profit = Math.max(0, unitPrice - costPrice);
      birthdayDiscount += profit * (settings.birthdayDiscountPercent / 100) * item.quantity;
    }

    return { gemstoneId: item.gemstoneId, jewelryId: item.jewelryId, label, unitPrice, quantity: item.quantity, lineTotal };
  });

  // A code only counts on /lk if the admin gave it a rupee value.
  const discountCode = cart.discountCode && (!lk || cart.discountCode.amountOffLkr != null) ? cart.discountCode : null;
  const codeDiscount = lk ? (discountCode?.amountOffLkr ?? 0) : (discountCode?.amountOff ?? 0);
  const afterDiscounts = Math.max(0, subtotal - birthdayDiscount - codeDiscount);

  // The only remaining currency conversion in this app: EMS's own rate
  // card is denominated in LKR (see lib/shipping.ts), so on the
  // international site that figure alone gets converted into USD here to
  // fold into an otherwise all-USD total — CommerceSettings.usdToLkrRate
  // exists for this (and the /lk birthday-discount cost above), not for
  // pricing the order itself. On /lk it's already in the right currency.
  const { zoneLabel: shippingZoneLabel, rateLKR: shippingRateLKR } = await resolveShippingRate(input.shippingCountry);
  const shipping = lk ? shippingRateLKR : shippingRateLKR / settings.usdToLkrRate;

  const tax = domestic || settings.applyVatToInternational ? afterDiscounts * (settings.vatPercent / 100) : 0;

  const gatewayCharged = afterDiscounts + tax + shipping;
  const chargesGatewayFee = (input.paymentMethod ?? "PAYHERE_CARD") === "PAYHERE_CARD";
  const handlingFee = chargesGatewayFee
    ? gatewayCharged * ((settings.gatewayCommissionPercent + settings.handlingFeeMarginPercent) / 100)
    : 0;
  const total = gatewayCharged + handlingFee;

  return {
    currency: lk ? "LKR" : "USD",
    market,
    discountCodeId: discountCode?.id ?? null,
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
