import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRetailCartWithItems, retailCartSubtotal } from "@/lib/retail-cart";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware guards this route

  const cart = await getRetailCartWithItems(session.user.id);
  if (cart.items.length === 0) redirect("/account/retail-cart");

  const subtotal = retailCartSubtotal(cart.items);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Checkout</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">Shipping &amp; Payment</h1>

      <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5">
        <p className="text-xs uppercase tracking-wide text-charcoal/45">Order Summary</p>
        <div className="mt-2 space-y-1">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-charcoal/75">
              <span>{(item.gemstone?.name ?? item.jewelry?.name ?? "Item")} × {item.quantity}</span>
              <span>{formatPrice((item.gemstone?.retailPrice ?? item.jewelry?.retailPrice ?? item.unitPrice) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t border-border-subtle pt-2 text-sm font-medium text-charcoal">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-charcoal/45">
          Final tax, EMS shipping, and handling fee are calculated after you enter your shipping address below.
        </p>
      </div>

      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
