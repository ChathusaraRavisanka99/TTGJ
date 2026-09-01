import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuoteStatusBadge } from "@/components/ui/Badge";

export default async function AdminCustomerDetailPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      quoteRequests: { orderBy: { createdAt: "desc" }, include: { gemstone: true, jewelry: true } },
      sourcingRequest: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) notFound();

  return (
    <div className="max-w-6xl">
      <h1 className="font-serif text-3xl text-charcoal">{customer.name}</h1>
      <p className="text-sm text-charcoal/60">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p>
      <p className="mt-1 text-xs text-charcoal/45">Joined {customer.createdAt.toLocaleDateString()}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="font-serif text-xl text-charcoal">Quote Requests</p>
          <div className="mt-3 space-y-2">
            {customer.quoteRequests.map((q) => (
              <Link key={q.id} href={`/admin/quotes/${q.id}`} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 hover:border-gold">
                <span className="text-sm text-charcoal">{q.gemstone?.name ?? q.jewelry?.name ?? "Configured gem"}</span>
                <QuoteStatusBadge status={q.status} />
              </Link>
            ))}
            {customer.quoteRequests.length === 0 && <p className="text-sm text-charcoal/50">No quote requests.</p>}
          </div>
        </div>

        <div>
          <p className="font-serif text-xl text-charcoal">Sourcing Requests</p>
          <div className="mt-3 space-y-2">
            {customer.sourcingRequest.map((r) => (
              <Link key={r.id} href={`/admin/sourcing/${r.id}`} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 hover:border-gold">
                <span className="text-sm text-charcoal">{r.mineralDescription}</span>
                <QuoteStatusBadge status={r.status} />
              </Link>
            ))}
            {customer.sourcingRequest.length === 0 && <p className="text-sm text-charcoal/50">No sourcing requests.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
