import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/ui/Pagination";
import { BackLink } from "@/components/admin/BackLink";
import { Badge } from "@/components/ui/Badge";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  QUALIFIED: "bg-sapphire-soft/15 text-sapphire border-sapphire-soft/30",
  REWARDED: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export default async function AdminReferralsPage({ searchParams }: PageProps<"/admin/referrals">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        referee: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.referral.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Referrals</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3">Referrer</th>
              <th className="px-4 py-3">Referred</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => (
              <tr key={r.id} className="border-b border-border-subtle last:border-0 hover:bg-ivory-soft">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${r.referrer.id}`} className="text-charcoal hover:text-gold">{r.referrer.name ?? r.referrer.email}</Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${r.referee.id}`} className="text-charcoal hover:text-gold">{r.referee.name ?? r.referee.email}</Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-charcoal/70">{r.code}</td>
                <td className="px-4 py-3 text-charcoal/70">{r.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3"><Badge className={STATUS_STYLES[r.status] ?? ""}>{r.status}</Badge></td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">No referrals yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
