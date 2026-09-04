import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";
import { CartContentForm } from "@/components/admin/CartContentForm";
import { getPageContent, DEFAULT_CART_CONTENT } from "@/lib/page-content";
import { cartTotal } from "@/lib/discount-codes";
import { cn, formatPrice } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function AdminCartsPage({ searchParams }: PageProps<"/admin/carts">) {
  const sp = await searchParams;
  const paymentStatus = sp.payment === "PAID" ? "PAID" : sp.payment === "AWAITING_PAYMENT" ? "AWAITING_PAYMENT" : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where = { status: "SUBMITTED" as const, ...(paymentStatus ? { paymentStatus: paymentStatus as never } : {}) };
  const [carts, total, cartContent] = await Promise.all([
    prisma.cart.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true, items: true, invoice: true },
    }),
    prisma.cart.count({ where }),
    getPageContent("cart", DEFAULT_CART_CONTENT),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Submitted Carts</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        A customer submits their cart once they&apos;re ready to pay for one or more accepted quotes/sourcing
        requests together — generate an invoice from here and mark it paid once the wire transfer arrives.
      </p>

      <div className="mt-6">
        <CartContentForm initialInstructions={cartContent.wireTransferInstructions} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/carts" className={cn("rounded-full border px-3 py-1 text-xs", !paymentStatus ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}>
          All
        </Link>
        <Link href="/admin/carts?payment=AWAITING_PAYMENT" className={cn("rounded-full border px-3 py-1 text-xs", paymentStatus === "AWAITING_PAYMENT" ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}>
          Awaiting Payment
        </Link>
        <Link href="/admin/carts?payment=PAID" className={cn("rounded-full border px-3 py-1 text-xs", paymentStatus === "PAID" ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}>
          Paid
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {carts.map((cart) => {
              const total = cartTotal(cart.items, cart.discountAmount);
              return (
                <tr key={cart.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                  <td className="px-4 py-3">
                    <Link href={`/admin/carts/${cart.id}`} className="text-charcoal hover:text-gold">{cart.user.email}</Link>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{cart.items.length}</td>
                  <td className="px-4 py-3 text-charcoal/70">{formatPrice(total)}</td>
                  <td className="px-4 py-3 text-charcoal/70">{cart.submittedAt?.toLocaleDateString()}</td>
                  <td className="px-4 py-3"><PaymentStatusBadge status={cart.paymentStatus} /></td>
                  <td className="px-4 py-3 text-charcoal/70">{cart.invoice ? cart.invoice.invoiceNumber : "—"}</td>
                </tr>
              );
            })}
            {carts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No submitted carts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
