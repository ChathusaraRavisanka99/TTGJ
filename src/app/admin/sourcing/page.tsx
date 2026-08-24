import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "EXPIRED"];

export default async function AdminSourcingPage({ searchParams }: PageProps<"/admin/sourcing">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const requests = await prisma.sourcingRequest.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Sourcing Requests</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/sourcing" className={cn("rounded-full border px-3 py-1 text-xs", !status ? "border-charcoal bg-charcoal text-ivory" : "border-border-subtle text-charcoal/70")}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/sourcing?status=${s}`}
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
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Flagged</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <Link href={`/admin/sourcing/${r.id}`} className="text-charcoal hover:text-gold">{r.mineralDescription}</Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{r.user.email}</td>
                <td className="px-4 py-3 text-charcoal/70">{r.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.noteFlaggedForPrice ? <span className="text-amber-700">⚠ Price?</span> : "—"}</td>
                <td className="px-4 py-3"><QuoteStatusBadge status={r.status} /></td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">No sourcing requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
