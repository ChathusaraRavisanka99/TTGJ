import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where = { role: "CUSTOMER" as const };
  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { quoteRequests: true, sourcingRequest: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Customers</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Quotes</th>
              <th className="px-4 py-3">Sourcing</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="text-charcoal hover:text-gold">{c.name ?? "—"}</Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{c.email}</td>
                <td className="px-4 py-3 text-charcoal/70">{c.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3 text-charcoal/70">{c._count.quoteRequests}</td>
                <td className="px-4 py-3 text-charcoal/70">{c._count.sourcingRequest}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">No registered customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
