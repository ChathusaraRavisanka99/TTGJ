import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";

const PAGE_SIZE = 20;

export default async function AdminBusinessAccountsPage({ searchParams }: PageProps<"/admin/business-accounts">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [accounts, total] = await Promise.all([
    prisma.businessAccount.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { owner: { select: { name: true, email: true } }, _count: { select: { members: true, orders: true } } },
    }),
    prisma.businessAccount.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Business Accounts</h1>
      <p className="mt-1 text-sm text-charcoal/60">One row per wholesale team — created automatically when a wholesale application is approved.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((b) => (
              <tr key={b.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3 text-charcoal">{b.name}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${b.ownerId}`} className="text-charcoal hover:text-gold">{b.owner.name ?? b.owner.email}</Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{b._count.members}</td>
                <td className="px-4 py-3 text-charcoal/70">{b._count.orders}</td>
                <td className="px-4 py-3 text-charcoal/70">{b.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">No business accounts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
