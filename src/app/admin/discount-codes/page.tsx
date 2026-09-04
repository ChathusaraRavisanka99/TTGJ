import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";
import { GenerateDiscountCodeForm } from "@/components/admin/GenerateDiscountCodeForm";
import { DeleteDiscountCodeButton } from "@/components/admin/DeleteDiscountCodeButton";
import { formatPrice } from "@/lib/utils";

const PAGE_SIZE = 30;

export default async function AdminDiscountCodesPage({ searchParams }: PageProps<"/admin/discount-codes">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [codes, total] = await Promise.all([
    prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { cart: { include: { user: true } } },
    }),
    prisma.discountCode.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Discount Codes</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Fixed-amount, single-use codes a customer can apply to their cart before submitting it.
      </p>

      <div className="mt-6">
        <GenerateDiscountCodeForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Amount Off</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Redeemed By</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3 font-mono text-charcoal">{c.code}</td>
                <td className="px-4 py-3 text-charcoal/70">{formatPrice(c.amountOff)}</td>
                <td className="px-4 py-3">
                  {c.usedAt ? (
                    <Badge className="border-charcoal/15 bg-charcoal/5 text-charcoal/60">Used</Badge>
                  ) : (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Available</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-charcoal/70">
                  {c.cart ? (
                    <Link href={`/admin/carts/${c.cart.id}`} className="hover:text-gold hover:underline">{c.cart.user.email}</Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-charcoal/70">{c.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {!c.usedAt && <DeleteDiscountCodeButton id={c.id} code={c.code} />}
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No discount codes yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
