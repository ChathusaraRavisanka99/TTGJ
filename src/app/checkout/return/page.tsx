import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Status" };

export default async function CheckoutReturnPage({ searchParams }: PageProps<"/checkout/return">) {
  const session = await auth();
  if (!session?.user) return null; // middleware guards this route

  const sp = await searchParams;
  const orderNumber = typeof sp.order === "string" ? sp.order : undefined;
  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber } })
    : null;

  if (!order || order.userId !== session.user.id) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center sm:px-8">
        <h1 className="font-serif text-3xl text-charcoal">Order not found</h1>
        <LinkButton href="/account/retail-cart" variant="primary" className="mt-6">Back to Cart</LinkButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center sm:px-8">
      {order.status === "PAID" ? (
        <>
          <p className="text-xs uppercase tracking-widest text-gold">Thank You</p>
          <h1 className="mt-2 font-serif text-4xl text-charcoal">Payment Received</h1>
          <p className="mt-4 text-charcoal/70">
            Order <span className="font-mono">{order.orderNumber}</span> — {formatPrice(order.total)} {order.currency}.
          </p>
        </>
      ) : (
        <>
          <p className="text-xs uppercase tracking-widest text-gold">One Moment</p>
          <h1 className="mt-2 font-serif text-4xl text-charcoal">Confirming Your Payment</h1>
          <p className="mt-4 text-charcoal/70">
            We&apos;re still waiting for PayHere to confirm order <span className="font-mono">{order.orderNumber}</span>.
            This can take a minute — refresh this page to check again.
          </p>
        </>
      )}
      <LinkButton href="/account" variant="primary" className="mt-8">Back to My Account</LinkButton>
      <p className="mt-4 text-sm text-charcoal/50">
        <Link href="/gems" className="underline hover:text-charcoal">Continue Shopping</Link>
      </p>
    </div>
  );
}
