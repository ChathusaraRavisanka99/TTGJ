import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRetailCartWithItems, retailCartItemLabel, retailCartSubtotal } from "@/lib/retail-cart";
import { isBirthdayEligible } from "@/lib/birthday-promo";
import { getActivePromotionMaps } from "@/lib/promotion-items";
import { RetailCartItemRow } from "@/components/catalog/RetailCartItemRow";
import { RetailDiscountCodeControl } from "@/components/catalog/RetailDiscountCodeControl";
import { LinkButton } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Your Cart" };

export default async function RetailCartPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware guards this route

  const [cart, user, promotions] = await Promise.all([
    getRetailCartWithItems(session.user.id),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { dateOfBirth: true, lastBirthdayDiscountAt: true } }),
    getActivePromotionMaps(),
  ]);

  const subtotal = retailCartSubtotal(cart.items);
  const birthdayEligible = isBirthdayEligible(user);
  const hasNonPromoItemWithCost = cart.items.some((item) => {
    const isPromotional = item.gemstoneId ? promotions.gemstonePrices.has(item.gemstoneId) : item.jewelryId ? promotions.jewelryPrices.has(item.jewelryId) : false;
    const costPrice = item.gemstone?.costPrice ?? item.jewelry?.costPrice ?? null;
    return !isPromotional && costPrice != null;
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Your Cart</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">Retail Cart</h1>

      {cart.items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border-subtle bg-surface p-8 text-center">
          <p className="text-charcoal/60">Your cart is empty.</p>
          <LinkButton href="/gems" variant="primary" className="mt-4">Browse Gemstones</LinkButton>
        </div>
      ) : (
        <>
          {birthdayEligible && hasNonPromoItemWithCost && (
            <div className="mt-6 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-charcoal">
              🎂 Happy birthday month! You&apos;ll get a discount off the profit margin on eligible items, applied
              automatically at checkout — once per year.
            </div>
          )}

          <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-5">
            {cart.items.map((item) => (
              <RetailCartItemRow
                key={item.id}
                item={{
                  id: item.id,
                  quantity: item.quantity,
                  unitPrice: (item.gemstone?.retailPrice ?? item.jewelry?.retailPrice ?? item.unitPrice) as number,
                  label: retailCartItemLabel(item),
                  href: item.gemstone ? `/gems/${item.gemstone.slug}` : `/jewelry/${item.jewelry!.slug}`,
                  imageUrl: (item.gemstone?.media[0]?.url) ?? (item.jewelry?.media[0]?.url),
                }}
              />
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5">
            <RetailDiscountCodeControl appliedCode={cart.discountCode?.code ?? null} />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
            <p className="text-sm text-charcoal/60">
              Subtotal ({cart.items.reduce((n, i) => n + i.quantity, 0)} item{cart.items.length === 1 ? "" : "s"})
            </p>
            <p className="font-serif text-2xl text-charcoal">{formatPrice(subtotal)}</p>
          </div>
          <p className="mt-1 text-right text-xs text-charcoal/45">Tax, shipping, and handling are calculated at checkout.</p>

          <div className="mt-6 flex justify-end">
            <LinkButton href="/checkout" variant="gold" size="lg">Proceed to Checkout</LinkButton>
          </div>
        </>
      )}

      <p className="mt-8 text-center text-sm text-charcoal/50">
        <Link href="/account" className="underline hover:text-charcoal">Back to My Account</Link>
      </p>
    </div>
  );
}
