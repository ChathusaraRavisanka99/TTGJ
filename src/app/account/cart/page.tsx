import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPageContent, DEFAULT_CART_CONTENT } from "@/lib/page-content";
import { cartTotal } from "@/lib/discount-codes";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { SubmitCartButton } from "@/components/quote/SubmitCartButton";
import { DiscountCodeControl } from "@/components/quote/DiscountCodeControl";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "My Cart" };

export default async function AccountCartPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [openCart, submittedCarts, cartContent] = await Promise.all([
    prisma.cart.findFirst({ where: { userId: session.user.id, status: "OPEN" }, include: { items: true, discountCode: true } }),
    prisma.cart.findMany({
      where: { userId: session.user.id, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      include: { items: true, invoice: true, discountCode: true },
    }),
    getPageContent("cart", DEFAULT_CART_CONTENT),
  ]);

  const openTotal = openCart ? cartTotal(openCart.items, openCart.discountAmount) : 0;
  const anyAwaitingPayment = submittedCarts.some((c) => c.paymentStatus === "AWAITING_PAYMENT");

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Account</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">My Cart</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Accepted quotes and sourcing requests land here automatically. Review the total, then submit when you&apos;re
        ready — payment is handled by wire transfer, confirmed with you directly.
      </p>

      {/* ---------- Open cart ---------- */}
      <div className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Ready to Submit</h2>
        {!openCart || openCart.items.length === 0 ? (
          <p className="mt-3 rounded-xl border border-border-subtle bg-surface p-5 text-sm text-charcoal/60">
            Nothing here yet. Once we accept one of your{" "}
            <Link href="/account/quotes" className="underline">quote requests</Link> or{" "}
            <Link href="/account/sourcing" className="underline">sourcing requests</Link>, it&apos;ll appear here with
            its price.
          </p>
        ) : (
          <div className="mt-3 rounded-xl border border-border-subtle bg-surface p-5">
            <div className="divide-y divide-border-subtle">
              {openCart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <p className="text-charcoal">{item.label}</p>
                  <p className="whitespace-nowrap font-serif text-charcoal">{formatPrice(item.amount)}</p>
                </div>
              ))}
              {openCart.discountAmount != null && (
                <div className="flex items-center justify-between gap-4 py-3">
                  <p className="text-charcoal/70">Discount ({openCart.discountCode?.code})</p>
                  <p className="whitespace-nowrap font-serif text-charcoal/70">−{formatPrice(openCart.discountAmount)}</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gold/30 pt-3">
              <p className="text-sm uppercase tracking-wide text-charcoal/60">Total</p>
              <p className="font-serif text-2xl text-gold">{formatPrice(openTotal)}</p>
            </div>
            <div className="mt-4 border-t border-border-subtle pt-4">
              <DiscountCodeControl appliedCode={openCart.discountCode?.code ?? null} />
            </div>
            <div className="mt-5">
              <SubmitCartButton />
            </div>
          </div>
        )}
      </div>

      {/* ---------- Wire transfer instructions, once anything's awaiting payment ---------- */}
      {anyAwaitingPayment && (
        <div className="mt-8 rounded-xl border border-gold/30 bg-gold/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Payment by Wire Transfer</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-charcoal/80">
            {cartContent.wireTransferInstructions}
          </p>
        </div>
      )}

      {/* ---------- Submitted history ---------- */}
      {submittedCarts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Submitted</h2>
          <div className="mt-3 space-y-4">
            {submittedCarts.map((cart) => {
              const total = cartTotal(cart.items, cart.discountAmount);
              return (
                <div key={cart.id} className="rounded-xl border border-border-subtle bg-surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-lg text-charcoal">{formatPrice(total)}</p>
                      <p className="mt-1 text-xs text-charcoal/50">
                        Submitted {cart.submittedAt?.toLocaleDateString()} · {cart.items.length} item
                        {cart.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <PaymentStatusBadge status={cart.paymentStatus} />
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-charcoal/70">
                    {cart.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-4">
                        <span>{item.label}</span>
                        <span className="whitespace-nowrap">{formatPrice(item.amount)}</span>
                      </li>
                    ))}
                    {cart.discountAmount != null && (
                      <li className="flex items-center justify-between gap-4">
                        <span>Discount ({cart.discountCode?.code})</span>
                        <span className="whitespace-nowrap">−{formatPrice(cart.discountAmount)}</span>
                      </li>
                    )}
                  </ul>
                  {cart.invoice && (
                    <p className="mt-3 text-xs text-charcoal/45">Invoice {cart.invoice.invoiceNumber} issued.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
