import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "My Orders" };

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PAYMENT_FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
};

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Account</p>
      <h1 className="mt-2 font-serif text-4xl text-charcoal">My Orders</h1>

      {orders.length === 0 ? (
        <p className="mt-10 text-charcoal/60">
          No orders yet. Browse our{" "}
          <Link href="/gems" className="underline">gemstones</Link> or{" "}
          <Link href="/jewelry" className="underline">jewelry</Link> to buy directly at their retail price.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border-subtle bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm text-charcoal/60">{o.orderNumber}</p>
                  <p className="mt-1 text-xs text-charcoal/50">
                    {o.createdAt.toLocaleDateString()} · {o.items.length} item{o.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge className={STATUS_STYLES[o.status] ?? ""}>{o.status.replaceAll("_", " ")}</Badge>
              </div>
              <div className="mt-3 space-y-1">
                {o.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-charcoal/75">
                    <span>{item.label} × {item.quantity}</span>
                    <span>{formatPrice(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-border-subtle pt-3">
                <p className="font-serif text-xl text-charcoal">{formatPrice(o.total)} {o.currency}</p>
                {o.status === "PENDING_PAYMENT" && (
                  <Link href={`/checkout/return?order=${o.orderNumber}`} className="text-xs text-gold underline">
                    Check status
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
