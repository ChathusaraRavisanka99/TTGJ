import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUnreadCount } from "@/lib/chat";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { BackLink } from "@/components/admin/BackLink";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "EXPIRED"];
const PAGE_SIZE = 20;

export default async function AdminSourcingPage({ searchParams }: PageProps<"/admin/sourcing">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where = status ? { status: status as never } : undefined;
  const [requests, total] = await Promise.all([
    prisma.sourcingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true },
    }),
    prisma.sourcingRequest.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const unreadCounts = await Promise.all(requests.map((r) => getUnreadCount("sourcing", r.id, "ADMIN")));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
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
            {requests.map((r, i) => {
              const unread = unreadCounts[i];
              return (
              <tr key={r.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <Link href={`/admin/sourcing/${r.id}`} className="flex items-center gap-2 text-charcoal hover:text-gold">
                    {r.mineralDescription}
                    {unread > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-medium text-charcoal">
                        <MessageCircle size={10} /> {unread}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{r.user.email}</td>
                <td className="px-4 py-3 text-charcoal/70">{r.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.noteFlaggedForPrice ? <span className="text-amber-700">⚠ Price?</span> : "—"}</td>
                <td className="px-4 py-3"><QuoteStatusBadge status={r.status} /></td>
              </tr>
              );
            })}
            {requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">No sourcing requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
