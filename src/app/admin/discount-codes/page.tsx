import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";
import { GenerateDiscountCodeForm } from "@/components/admin/GenerateDiscountCodeForm";
import { DeleteDiscountCodeButton } from "@/components/admin/DeleteDiscountCodeButton";
import { formatPrice } from "@/lib/utils";

const PAGE_SIZE = 30;

function statusBadge(c: { active: boolean; expiresAt: Date | null; maxUses: number | null; usesCount: number }) {
  if (!c.active) return <Badge className="border-charcoal/15 bg-charcoal/5 text-charcoal/60">Disabled</Badge>;
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) {
    return <Badge className="border-charcoal/15 bg-charcoal/5 text-charcoal/60">Expired</Badge>;
  }
  if (c.maxUses != null && c.usesCount >= c.maxUses) {
    return <Badge className="border-charcoal/15 bg-charcoal/5 text-charcoal/60">Exhausted</Badge>;
  }
  return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Available</Badge>;
}

export default async function AdminDiscountCodesPage({ searchParams }: PageProps<"/admin/discount-codes">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [codes, total, customers] = await Promise.all([
    prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignedUser: true },
    }),
    prisma.discountCode.count(),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, select: { id: true, email: true, name: true }, orderBy: { email: "asc" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Discount Codes</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Fixed-amount codes a customer can apply to their cart — site-wide or tied to one customer, with an optional
        use limit and expiry date.
      </p>

      <div className="mt-6">
        <GenerateDiscountCodeForm customers={customers} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Amount Off</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3 font-mono text-charcoal">{c.code}</td>
                <td className="px-4 py-3 text-charcoal/70">{formatPrice(c.amountOff)}</td>
                <td className="px-4 py-3 text-charcoal/70">
                  {c.assignedUser ? (
                    <Link href={`/admin/customers/${c.assignedUser.id}`} className="hover:text-gold hover:underline">
                      {c.assignedUser.email}
                    </Link>
                  ) : (
                    "Anyone"
                  )}
                </td>
                <td className="px-4 py-3 text-charcoal/70">
                  {c.usesCount} / {c.maxUses ?? "∞"}
                </td>
                <td className="px-4 py-3 text-charcoal/70">{c.expiresAt ? c.expiresAt.toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">{statusBadge(c)}</td>
                <td className="px-4 py-3 text-charcoal/70">{c.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {c.usesCount === 0 && <DeleteDiscountCodeButton id={c.id} code={c.code} />}
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal/50">No discount codes yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
