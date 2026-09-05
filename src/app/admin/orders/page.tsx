import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUSES = ["PENDING_PAYMENT", "PAID", "PAYMENT_FAILED", "CANCELLED"];
const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PAYMENT_FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
};

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where = status ? { status: status as never } : undefined;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true },
    }),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Retail Orders</h1>
      <p className="mt-1 text-sm text-charcoal/60">Direct-purchase orders paid through PayHere.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/orders" className={cn("rounded-full border px-3 py-1 text-xs", !status ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={cn("rounded-full border px-3 py-1 text-xs", status === s ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}
          >
            {s.replaceAll("_", " ")}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Shipping To</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3 font-mono text-charcoal">{o.orderNumber}</td>
                <td className="px-4 py-3 text-charcoal/70">{o.user.email}</td>
                <td className="px-4 py-3 text-charcoal/70">{formatPrice(o.total)} {o.currency}</td>
                <td className="px-4 py-3 text-charcoal/70">{o.shipCity}, {o.shipCountry}</td>
                <td className="px-4 py-3 text-charcoal/70">{o.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3"><Badge className={STATUS_STYLES[o.status] ?? ""}>{o.status.replaceAll("_", " ")}</Badge></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
