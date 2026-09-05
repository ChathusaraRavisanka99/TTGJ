import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Payment Cancelled" };

export default async function CheckoutCancelPage({ searchParams }: PageProps<"/checkout/cancel">) {
  const session = await auth();
  if (!session?.user) return null; // middleware guards this route

  const sp = await searchParams;
  const orderNumber = typeof sp.order === "string" ? sp.order : undefined;

  if (orderNumber) {
    const order = await prisma.order.findUnique({ where: { orderNumber } });
    // Only cancel an order that's still awaiting payment and actually
    // belongs to this customer — never touch one PayHere already
    // confirmed PAID via the notify webhook, which can race ahead of
    // this redirect landing.
    if (order && order.userId === session.user.id && order.status === "PENDING_PAYMENT") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    }
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Payment Cancelled</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">No Charge Was Made</h1>
      <p className="mt-4 text-charcoal/70">Your cart is still here whenever you&apos;re ready to try again.</p>
      <LinkButton href="/account/retail-cart" variant="primary" className="mt-8">Back to Cart</LinkButton>
    </div>
  );
}
