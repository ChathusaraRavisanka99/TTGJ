import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";
import { GenerateDiscountCodeForm } from "@/components/admin/GenerateDiscountCodeForm";
import { DeleteDiscountCodeButton } from "@/components/admin/DeleteDiscountCodeButton";
import { AdminSearchBox } from "@/components/admin/AdminSearchBox";
import { formatPrice } from "@/lib/utils";
import { CARD_TABLE, CARD_THEAD, CARD_TBODY, CARD_TR, CARD_TD, CARD_FIRST, CARD_SECOND, CARD_TD_ACTIONS } from "@/components/admin/responsive-table";

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
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const where = q ? { code: { contains: q, mode: "insensitive" as const } } : {};

  const [codes, total, customers] = await Promise.all([
    prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignedUser: true },
    }),
    prisma.discountCode.count({ where }),
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
        <AdminSearchBox placeholder="Search by code..." />
      </div>

      <div className="mt-6">
        <GenerateDiscountCodeForm customers={customers} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className={CARD_TABLE}>
          <thead className={CARD_THEAD}>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/65">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Amount Off</th>
              <th className="px-4 py-3">Amount Off (LKR)</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className={CARD_TBODY}>
            {codes.map((c) => (
              <tr key={c.id} className={CARD_TR}>
                <td className={`${CARD_FIRST} font-mono text-charcoal`}>{c.code}</td>
                <td data-label="Amount off" className={`${CARD_TD} text-charcoal/70`}>{formatPrice(c.amountOff)}</td>
                <td data-label="Amount off (LKR)" className={`${CARD_TD} text-charcoal/70`}>{c.amountOffLkr != null ? formatPrice(c.amountOffLkr, "LKR") : "—"}</td>
                <td data-label="Scope" className={`${CARD_TD} text-charcoal/70`}>
                  {c.assignedUser ? (
                    <Link href={`/admin/customers/${c.assignedUser.id}`} className="hover:text-gold hover:underline">
                      {c.assignedUser.email}
                    </Link>
                  ) : (
                    "Anyone"
                  )}
                </td>
                <td data-label="Uses" className={`${CARD_TD} text-charcoal/70`}>
                  {c.usesCount} / {c.maxUses ?? "âˆž"}
                </td>
                <td data-label="Expires" className={`${CARD_TD} text-charcoal/70`}>{c.expiresAt ? c.expiresAt.toLocaleDateString() : "—"}</td>
                <td data-label="Status" className={`${CARD_SECOND}`}>{statusBadge(c)}</td>
                <td data-label="Created" className={`${CARD_TD} text-charcoal/70`}>{c.createdAt.toLocaleDateString()}</td>
                <td className={`${CARD_TD_ACTIONS}`}>
                  {c.usesCount === 0 && <DeleteDiscountCodeButton id={c.id} code={c.code} />}
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr className="max-lg:block"><td colSpan={9} className="px-4 py-8 text-center text-charcoal/65 max-lg:block">No discount codes yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
