import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { BackLink } from "@/components/admin/BackLink";
import { AdminSearchBox } from "@/components/admin/AdminSearchBox";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const type = sp.type === "WHOLESALE" ? ("WHOLESALE" as const) : sp.type === "RETAIL" ? ("RETAIL" as const) : undefined;

  const where = {
    role: "CUSTOMER" as const,
    ...(type ? { customerType: type } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
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

      <div className="mt-4">
        <AdminSearchBox placeholder="Search by name or email..." />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {([["All", undefined], ["Retail", "RETAIL"], ["Wholesale", "WHOLESALE"]] as const).map(([label, value]) => (
          <Link
            key={label}
            href={`/admin/customers?${new URLSearchParams({ ...(value ? { type: value } : {}), ...(q ? { q } : {}) }).toString()}`}
            className={cn("rounded-full border px-3 py-1 text-xs", type === value ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
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
                <td className="px-4 py-3">
                  <Badge className={c.customerType === "WHOLESALE" ? "border-gold/40 bg-gold/15 text-charcoal" : "border-border-subtle bg-charcoal/5 text-charcoal/70"}>
                    {c.customerType === "WHOLESALE" ? "Wholesale" : "Retail"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{c.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3 text-charcoal/70">{c._count.quoteRequests}</td>
                <td className="px-4 py-3 text-charcoal/70">{c._count.sourcingRequest}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No registered customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
