import Link from "next/link";
import { Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";

const PAGE_SIZE = 20;

export default async function AdminInvoicesPage({ searchParams }: PageProps<"/admin/invoices">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true, quoteRequest: { include: { gemstone: true, jewelry: true } } },
    }),
    prisma.invoice.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Invoices</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Created automatically whenever a quote is marked Accepted — see a quote&apos;s Documents panel to accept one.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Documents</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <Link href={`/admin/invoices/${inv.id}`} className="text-charcoal hover:text-gold">{inv.invoiceNumber}</Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">
                  {inv.quoteRequest.gemstone?.name ?? inv.quoteRequest.jewelry?.name ?? "Configured gem"}
                </td>
                <td className="px-4 py-3 text-charcoal/70">{inv.user.email}</td>
                <td className="px-4 py-3 text-charcoal/70">{formatPrice(inv.amount)}</td>
                <td className="px-4 py-3 text-charcoal/70">{inv.issuedAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    title="Print invoice"
                    className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-gold"
                  >
                    <Printer size={14} /> Print
                  </Link>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
