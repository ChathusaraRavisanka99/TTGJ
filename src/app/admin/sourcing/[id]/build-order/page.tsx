import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMasterData } from "@/lib/catalog";
import { BackLink } from "@/components/admin/BackLink";
import { SourcingOrderBuilder } from "@/components/admin/SourcingOrderBuilder";

export default async function BuildSourcingOrderPage({ params }: PageProps<"/admin/sourcing/[id]/build-order">) {
  const { id } = await params;
  const [request, masterData] = await Promise.all([
    prisma.sourcingRequest.findUnique({ where: { id }, include: { user: true, order: true } }),
    getMasterData(),
  ]);
  if (!request) notFound();
  // Already built (idempotent, same as ensureOrderForSourcing/
  // ensureOrderForQuote) — nothing left to do here.
  if (request.order) redirect(`/admin/orders/${request.order.id}`);

  return (
    <div>
      <BackLink href={`/admin/sourcing/${id}`} label="Back to Sourcing Request" />
      <h1 className="font-serif text-3xl text-charcoal">Build Order</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        For {request.user.name ?? request.user.email} — &ldquo;{request.mineralDescription}&rdquo;. Add the item(s) you
        sourced (existing catalog items or brand-new ones just for this sale), then send it to the customer as unpaid.
      </p>
      <div className="mt-6">
        <SourcingOrderBuilder
          sourcingRequestId={request.id}
          minerals={masterData.minerals.map((m) => ({ id: m.id, name: m.name }))}
          cuts={masterData.cuts.map((c) => ({ id: c.id, name: c.name }))}
          clarityGrades={masterData.clarityGrades.map((c) => ({ id: c.id, name: c.name }))}
          treatments={masterData.treatments.map((t) => ({ id: t.id, name: t.name }))}
          origins={masterData.origins.map((o) => ({ id: o.id, name: o.name }))}
        />
      </div>
    </div>
  );
}
