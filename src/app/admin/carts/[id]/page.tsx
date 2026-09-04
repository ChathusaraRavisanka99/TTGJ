import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { CartPaymentControls } from "@/components/admin/CartPaymentControls";
import { BackLink } from "@/components/admin/BackLink";
import { formatPrice } from "@/lib/utils";

export default async function AdminCartDetailPage({ params }: PageProps<"/admin/carts/[id]">) {
  const { id } = await params;
  const cart = await prisma.cart.findUnique({
    where: { id },
    include: { user: true, items: true, invoice: true },
  });

  if (!cart) notFound();

  const total = cart.items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/carts" label="Back to Submitted Carts" />
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Cart</h1>
        <PaymentStatusBadge status={cart.paymentStatus} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/45">Items</p>
            <div className="mt-3 divide-y divide-border-subtle">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-charcoal">{item.label}</p>
                    <p className="text-xs text-charcoal/45">
                      {item.quoteRequestId ? (
                        <Link href={`/admin/quotes/${item.quoteRequestId}`} className="underline hover:text-gold">View quote</Link>
                      ) : (
                        <Link href={`/admin/sourcing/${item.sourcingRequestId}`} className="underline hover:text-gold">View sourcing request</Link>
                      )}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-serif text-charcoal">{formatPrice(item.amount)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gold/30 pt-3">
              <p className="text-sm uppercase tracking-wide text-charcoal/60">Total</p>
              <p className="font-serif text-xl text-gold">{formatPrice(total)}</p>
            </div>
            <p className="mt-3 text-xs text-charcoal/45">Submitted {cart.submittedAt?.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/45">Customer</p>
            <p className="mt-1 text-charcoal">{cart.user.name}</p>
            <p className="text-sm text-charcoal/60">{cart.user.email}</p>
            {cart.user.phone && <p className="text-sm text-charcoal/60">{cart.user.phone}</p>}
            <Link href={`/admin/customers/${cart.user.id}`} className="mt-2 inline-block text-xs text-gold underline">
              View customer history
            </Link>
          </div>

          {cart.invoice && (
            <div className="rounded-xl border border-border-subtle bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-charcoal/45">Documents</p>
              <Link
                href={`/admin/carts/${cart.id}/invoice`}
                className="mt-3 inline-block text-sm text-gold underline decoration-gold/40 underline-offset-2 hover:text-charcoal"
              >
                View invoice {cart.invoice.invoiceNumber} →
              </Link>
            </div>
          )}

          <CartPaymentControls cartId={cart.id} paymentStatus={cart.paymentStatus} hasInvoice={!!cart.invoice} />
        </div>
      </div>
    </div>
  );
}
